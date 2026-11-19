-- =============================================================================
-- Funções da equipe: "sessão não identificada" ≠ "sem permissão"
--
-- Em conexões novas, a Data API do Neon às vezes executa a requisição antes de carregar a
-- sessão do JWT (auth.uid() nulo). Antes, as funções abaixo respondiam "Apenas a equipe..."
-- e o app mostrava "sem permissão". Agora respondem "Sessão não identificada", que o app
-- reconhece e repete automaticamente (a checagem vem antes de qualquer alteração).
-- =============================================================================

-- moderate_profile (definição anterior: 20261118000400_moderation.sql)
create or replace function public.moderate_profile(
  target_profile_id uuid,
  new_status public.publication_status,
  reason text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Conexão nova do Neon às vezes chega sem a sessão do JWT: avisa para o app tentar de novo.
  if current_user in ('anonymous', 'authenticated', 'authenticator') and public.current_account_id() is null then
    raise exception 'Sessão não identificada. Tente novamente.' using errcode = '42501';
  end if;
  if current_user in ('anonymous', 'authenticated', 'authenticator') and not public.is_moderator() then
    raise exception 'Apenas a moderação do Mural pode executar esta ação.';
  end if;

  update public.entrepreneur_profiles
     set publication_status = new_status,
         suspension_reason = case when new_status = 'suspended' then left(btrim(reason), 500) end
   where id = target_profile_id;

  if not found then
    raise exception 'Perfil não encontrado.';
  end if;
end;
$$;

-- list_members (definição anterior: 20261119000800_member_roles.sql)
create or replace function public.list_members(search text default '', page_size integer default 30)
returns table (id uuid, full_name text, email text, role text, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  term text := '%' || public.escape_like(public.normalize_search_text(left(btrim(coalesce(search, '')), 100))) || '%';
begin
  -- Conexão nova do Neon às vezes chega sem a sessão do JWT: avisa para o app tentar de novo
  -- (em vez de responder "sem permissão").
  if auth.uid() is null then
    raise exception 'Sessão não identificada. Tente novamente.' using errcode = '42501';
  end if;
  if not public.is_developer() then
    raise exception 'Apenas o desenvolvedor pode gerenciar cargos.' using errcode = '42501';
  end if;

  return query
    select u.id, u.full_name, u.email, coalesce(r.role::text, 'entrepreneur'), u.created_at
      from public.users u
      left join public.user_roles r on r.user_id = u.id
     where public.normalize_search_text(u.full_name || ' ' || u.email) like term
     order by (r.role is null), r.role, u.full_name
     limit least(greatest(coalesce(page_size, 30), 1), 100);
end;
$$;

-- set_member_role (definição anterior: 20261119001000_role_by_email.sql)
create or replace function public.set_member_role(target_user_id uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Conexão nova do Neon às vezes chega sem a sessão do JWT: avisa para o app tentar de novo
  -- (em vez de responder "sem permissão").
  if auth.uid() is null then
    raise exception 'Sessão não identificada. Tente novamente.' using errcode = '42501';
  end if;
  if not public.is_developer() then
    raise exception 'Apenas o desenvolvedor pode gerenciar cargos.' using errcode = '42501';
  end if;
  if target_user_id = auth.uid() then
    raise exception 'Você não pode alterar o próprio cargo.';
  end if;
  if new_role is null or new_role not in ('developer', 'administrator', 'entrepreneur') then
    raise exception 'Cargo inválido. Use developer, administrator ou entrepreneur.';
  end if;
  if not exists (select 1 from neon_auth."user" u where u.id = target_user_id) then
    raise exception 'Conta não encontrada.';
  end if;

  if new_role = 'entrepreneur' then
    delete from public.user_roles where user_id = target_user_id;
  else
    insert into public.user_roles (user_id, role)
    values (target_user_id, new_role::public.member_role)
    on conflict (user_id) do update set role = excluded.role, created_at = now();
  end if;
end;
$$;

-- set_member_role_by_email (definição anterior: 20261119001000_role_by_email.sql)
create or replace function public.set_member_role_by_email(target_email text, new_role text)
returns table (id uuid, email text, role text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid;
begin
  -- Conexão nova do Neon às vezes chega sem a sessão do JWT: avisa para o app tentar de novo
  -- (em vez de responder "sem permissão").
  if auth.uid() is null then
    raise exception 'Sessão não identificada. Tente novamente.' using errcode = '42501';
  end if;
  if not public.is_developer() then
    raise exception 'Apenas o desenvolvedor pode gerenciar cargos.' using errcode = '42501';
  end if;

  select u.id into target_id
    from neon_auth."user" u
   where lower(u.email) = lower(btrim(coalesce(target_email, '')));

  if target_id is null then
    raise exception 'Nenhuma conta com o e-mail %. A pessoa precisa se cadastrar no app primeiro.', btrim(coalesce(target_email, ''))
      using errcode = 'P0002';
  end if;

  perform public.set_member_role(target_id, new_role);

  return query
    select u.id, u.email, coalesce(r.role::text, 'entrepreneur')
      from neon_auth."user" u
      left join public.user_roles r on r.user_id = u.id
     where u.id = target_id;
end;
$$;

-- list_pending_claims (definição anterior: 20261119001200_profile_claims.sql)
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
  -- Conexão nova do Neon às vezes chega sem a sessão do JWT: avisa para o app tentar de novo
  -- (em vez de responder "sem permissão").
  if auth.uid() is null then
    raise exception 'Sessão não identificada. Tente novamente.' using errcode = '42501';
  end if;
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

-- review_profile_claim (definição anterior: 20261119001200_profile_claims.sql)
create or replace function public.review_profile_claim(target_claim_id uuid, approve boolean, note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  claim public.profile_claims;
begin
  -- Conexão nova do Neon às vezes chega sem a sessão do JWT: avisa para o app tentar de novo
  -- (em vez de responder "sem permissão").
  if auth.uid() is null then
    raise exception 'Sessão não identificada. Tente novamente.' using errcode = '42501';
  end if;
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

-- link_profile_to_account (definição anterior: 20261119001200_profile_claims.sql)
create or replace function public.link_profile_to_account(target_profile_id uuid, target_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user uuid;
begin
  -- Conexão nova do Neon às vezes chega sem a sessão do JWT: avisa para o app tentar de novo
  -- (em vez de responder "sem permissão").
  if auth.uid() is null then
    raise exception 'Sessão não identificada. Tente novamente.' using errcode = '42501';
  end if;
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
