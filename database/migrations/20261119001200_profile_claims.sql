-- =============================================================================
-- Vincular um perfil do grupo à conta da empreendedora
--
-- Os perfis cadastrados pela organização (user_id nulo) podem passar a pertencer à
-- empreendedora que criar conta no app:
--   1. ela pede o vínculo pelo app (request_profile_claim);
--   2. uma administradora ou o desenvolvedor confirma ou recusa (review_profile_claim).
-- A equipe também pode vincular direto, pelo e-mail da conta (link_profile_to_account).
-- Depois do vínculo, só a dona edita o conteúdo (regras de RLS/gatilho já existentes).
-- =============================================================================

create type public.claim_status as enum ('pending', 'approved', 'rejected', 'cancelled');

create table public.profile_claims (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.entrepreneur_profiles (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  message text,
  status public.claim_status not null default 'pending',
  review_note text,
  reviewed_by uuid references public.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint profile_claims_message_length check (message is null or char_length(message) <= 500),
  constraint profile_claims_review_note_length check (review_note is null or char_length(review_note) <= 500)
);

comment on table public.profile_claims is
  'Pedidos de vínculo de um perfil do grupo (sem conta) à conta de uma empreendedora. Analisados pela equipe do Mural.';

-- Uma conta tem no máximo um pedido em análise por vez.
create unique index profile_claims_one_pending_per_user_idx
  on public.profile_claims (user_id)
  where status = 'pending';

create index profile_claims_pending_idx
  on public.profile_claims (created_at)
  where status = 'pending';

create index profile_claims_profile_idx on public.profile_claims (profile_id);

alter table public.profile_claims enable row level security;

create policy "claims_select_own"
  on public.profile_claims for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "claims_select_moderation"
  on public.profile_claims for select
  to authenticated
  using ((select public.is_moderator()));

-- Escrita só pelas funções abaixo (que validam tudo).
revoke all on public.profile_claims from anonymous;
revoke insert, update, delete, truncate, references, trigger on public.profile_claims from authenticated;

-- -----------------------------------------------------------------------------
-- Gatilho de perfis: a dona só muda num caso — vincular um perfil do grupo (sem conta)
-- a uma conta, feito pelas funções abaixo (security definer, dona do banco).
-- -----------------------------------------------------------------------------
create or replace function private.entrepreneur_profiles_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  is_db_owner constant boolean := current_user not in ('anonymous', 'authenticated', 'authenticator');
  -- dona do banco (SQL) e equipe do Mural podem suspender/reativar perfis.
  privileged constant boolean := is_db_owner or public.is_moderator();
  full_access constant boolean := is_db_owner or public.is_developer();
  status_fields constant text[] := array[
    'publication_status', 'suspension_reason', 'suspended_at', 'published_at', 'updated_at', 'sort_name', 'search_text'
  ];
begin
  -- 1) Sanitização defensiva (o app também valida e normaliza os dados).
  new.business_name := btrim(regexp_replace(new.business_name, '\s+', ' ', 'g'));
  new.entrepreneur_name := btrim(regexp_replace(new.entrepreneur_name, '\s+', ' ', 'g'));
  new.service_description := btrim(regexp_replace(new.service_description, E'\\n{3,}', E'\n\n', 'g'));
  new.city := nullif(btrim(regexp_replace(coalesce(new.city, ''), '\s+', ' ', 'g')), '');
  new.state := nullif(upper(btrim(coalesce(new.state, ''))), '');
  new.category := nullif(btrim(coalesce(new.category, '')), '');
  new.instagram_url := nullif(btrim(coalesce(new.instagram_url, '')), '');
  new.website_url := nullif(btrim(coalesce(new.website_url, '')), '');
  new.contact_url := nullif(btrim(coalesce(new.contact_url, '')), '');
  new.community_perks := coalesce(
    array(select distinct perk from unnest(new.community_perks) as perk order by perk),
    '{}'
  );

  -- 2) Regras por operação.
  if tg_op = 'INSERT' then
    if new.publication_status = 'suspended' and not privileged then
      raise exception 'Somente a moderação do Mural pode suspender perfis.';
    end if;
    new.created_at := now();
    new.public_consent_at := case when new.public_consent_at is not null then now() end;
    new.published_at := case when new.publication_status = 'published' then now() end;
  else
    if new.user_id is distinct from old.user_id
       and not (is_db_owner and old.user_id is null and new.user_id is not null) then
      raise exception 'Não é possível transferir o perfil para outra conta.';
    end if;
    new.id := old.id;
    new.created_at := old.created_at;

    -- Administradora: conteúdo de perfis de outras empreendedoras é somente leitura.
    if not full_access
       and old.user_id is not null
       and old.user_id is distinct from public.current_account_id()
       and (to_jsonb(new) - status_fields) is distinct from (to_jsonb(old) - status_fields) then
      raise exception 'Somente a dona do perfil (ou o desenvolvedor) pode editar este conteúdo. A administração pode apenas suspender ou reativar.'
        using errcode = 'P0001';
    end if;

    if not privileged then
      if old.publication_status = 'suspended' and new.publication_status <> 'suspended' then
        raise exception 'Este perfil foi suspenso pela moderação e só pode ser reativado pela equipe do Mural.';
      end if;
      if new.publication_status = 'suspended' and old.publication_status <> 'suspended' then
        raise exception 'Somente a moderação do Mural pode suspender perfis.';
      end if;
      new.suspension_reason := old.suspension_reason;
      -- A data da primeira publicação não pode ser alterada pela usuária.
      new.published_at := old.published_at;
    end if;

    -- O consentimento fica registrado com o horário do servidor e não pode ser reescrito.
    new.public_consent_at := coalesce(
      old.public_consent_at,
      case when new.public_consent_at is not null then now() end
    );
  end if;

  if new.publication_status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;

  -- 3) Controle da suspensão.
  if new.publication_status = 'suspended' then
    if tg_op = 'INSERT' or old.publication_status <> 'suspended' then
      new.suspended_at := now();
    else
      new.suspended_at := old.suspended_at;
    end if;
  else
    new.suspended_at := null;
    new.suspension_reason := null;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Função interna: passa um perfil do grupo para uma conta (com todas as checagens).
-- -----------------------------------------------------------------------------
create or replace function private.assign_group_profile(target_profile_id uuid, target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_owner uuid;
begin
  select p.user_id into current_owner
    from public.entrepreneur_profiles p
   where p.id = target_profile_id
   for update;

  if not found then
    raise exception 'Perfil não encontrado.' using errcode = 'P0002';
  end if;
  if current_owner is not null then
    raise exception 'Este perfil já está vinculado a uma conta.';
  end if;
  if exists (select 1 from public.entrepreneur_profiles p where p.user_id = target_user_id) then
    raise exception 'Esta conta já tem um perfil no Mural. Para vincular este, a empreendedora precisa excluir o perfil atual primeiro.';
  end if;

  update public.entrepreneur_profiles set user_id = target_user_id where id = target_profile_id;

  -- Outros pedidos em aberto para o mesmo perfil deixam de valer.
  update public.profile_claims
     set status = 'rejected',
         review_note = 'Este perfil foi vinculado a outra conta.',
         reviewed_by = public.current_account_id(),
         reviewed_at = now()
   where profile_id = target_profile_id
     and status = 'pending'
     and user_id <> target_user_id;
end;
$$;

revoke all on function private.assign_group_profile(uuid, uuid) from public;

-- -----------------------------------------------------------------------------
-- Empreendedora: pedir e cancelar o vínculo
-- -----------------------------------------------------------------------------
create or replace function public.request_profile_claim(target_profile_id uuid, note text default null)
returns public.profile_claims
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_uid uuid := auth.uid();
  owner_id uuid;
  result public.profile_claims;
begin
  if current_uid is null then
    raise exception 'Sessão não identificada. Tente novamente.' using errcode = '42501';
  end if;
  perform public.ensure_my_account();

  select p.user_id into owner_id from public.entrepreneur_profiles p where p.id = target_profile_id;
  if not found then
    raise exception 'Perfil não encontrado.' using errcode = 'P0002';
  end if;
  if owner_id is not null then
    raise exception 'Este perfil já está vinculado a uma conta.';
  end if;
  if exists (select 1 from public.entrepreneur_profiles p where p.user_id = current_uid) then
    raise exception 'Sua conta já tem um perfil no Mural. Para vincular este, exclua o perfil atual primeiro (Meu Perfil → Editar perfil → Excluir perfil).';
  end if;
  if exists (select 1 from public.profile_claims c where c.user_id = current_uid and c.status = 'pending') then
    raise exception 'Você já tem um pedido de vínculo em análise. Aguarde a resposta ou cancele o pedido em Meu Perfil.';
  end if;

  insert into public.profile_claims (profile_id, user_id, message)
  values (target_profile_id, current_uid, nullif(left(btrim(coalesce(note, '')), 500), ''))
  returning * into result;

  return result;
end;
$$;

create or replace function public.cancel_profile_claim(target_claim_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profile_claims
     set status = 'cancelled', reviewed_at = now()
   where id = target_claim_id
     and user_id = auth.uid()
     and status = 'pending';
  if not found then
    raise exception 'Pedido não encontrado ou já analisado.';
  end if;
end;
$$;

-- Último pedido da conta logada, com o nome do perfil (para a tela Meu Perfil).
create or replace function public.my_profile_claim()
returns table (
  id uuid,
  profile_id uuid,
  business_name text,
  status public.claim_status,
  review_note text,
  created_at timestamptz,
  reviewed_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.profile_id, p.business_name, c.status, c.review_note, c.created_at, c.reviewed_at
    from public.profile_claims c
    join public.entrepreneur_profiles p on p.id = c.profile_id
   where c.user_id = auth.uid()
   order by c.created_at desc
   limit 1;
$$;

-- -----------------------------------------------------------------------------
-- Equipe do Mural (administradora ou desenvolvedor)
-- -----------------------------------------------------------------------------
create or replace function public.list_pending_claims()
returns table (
  id uuid,
  profile_id uuid,
  business_name text,
  entrepreneur_name text,
  instagram_url text,
  account_name text,
  account_email text,
  message text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_moderator() then
    raise exception 'Apenas a equipe do Mural pode ver os pedidos de vínculo.' using errcode = '42501';
  end if;
  return query
    select c.id, c.profile_id, p.business_name, p.entrepreneur_name, p.instagram_url,
           u.full_name, u.email, c.message, c.created_at
      from public.profile_claims c
      join public.entrepreneur_profiles p on p.id = c.profile_id
      join public.users u on u.id = c.user_id
     where c.status = 'pending'
     order by c.created_at;
end;
$$;

create or replace function public.review_profile_claim(target_claim_id uuid, approve boolean, note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  claim public.profile_claims;
begin
  if not public.is_moderator() then
    raise exception 'Apenas a equipe do Mural pode analisar pedidos de vínculo.' using errcode = '42501';
  end if;

  select * into claim from public.profile_claims c where c.id = target_claim_id for update;
  if not found then
    raise exception 'Pedido não encontrado.' using errcode = 'P0002';
  end if;
  if claim.status <> 'pending' then
    raise exception 'Este pedido já foi analisado.';
  end if;

  if approve then
    perform private.assign_group_profile(claim.profile_id, claim.user_id);
  end if;

  update public.profile_claims
     set status = case when approve then 'approved'::public.claim_status else 'rejected'::public.claim_status end,
         review_note = nullif(left(btrim(coalesce(note, '')), 500), ''),
         reviewed_by = auth.uid(),
         reviewed_at = now()
   where id = target_claim_id;
end;
$$;

create or replace function public.link_profile_to_account(target_profile_id uuid, target_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user uuid;
begin
  if not public.is_moderator() then
    raise exception 'Apenas a equipe do Mural pode vincular perfis.' using errcode = '42501';
  end if;

  select u.id into target_user
    from public.users u
   where lower(u.email) = lower(btrim(coalesce(target_email, '')));
  if target_user is null then
    raise exception 'Nenhuma conta com o e-mail % no app. A empreendedora precisa criar a conta e entrar no app pelo menos uma vez.',
      btrim(coalesce(target_email, '')) using errcode = 'P0002';
  end if;

  perform private.assign_group_profile(target_profile_id, target_user);

  -- Um pedido dela para este perfil, se houver, fica aprovado.
  update public.profile_claims
     set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
   where profile_id = target_profile_id and user_id = target_user and status = 'pending';
end;
$$;

revoke execute on function
  public.request_profile_claim(uuid, text),
  public.cancel_profile_claim(uuid),
  public.my_profile_claim(),
  public.list_pending_claims(),
  public.review_profile_claim(uuid, boolean, text),
  public.link_profile_to_account(uuid, text)
from public, anonymous;

grant execute on function
  public.request_profile_claim(uuid, text),
  public.cancel_profile_claim(uuid),
  public.my_profile_claim(),
  public.list_pending_claims(),
  public.review_profile_claim(uuid, boolean, text),
  public.link_profile_to_account(uuid, text)
to authenticated;
