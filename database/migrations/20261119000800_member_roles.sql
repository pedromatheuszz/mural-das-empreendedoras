-- =============================================================================
-- Cargos do app e permissões
--
--   developer      Desenvolvedor   — acesso total (editar/excluir qualquer perfil, cargos).
--   administrator  Administradora  — admins do grupo: moderação, denúncias e perfis do grupo.
--   (sem cargo)    Empreendedora   — demais integrantes: só o próprio perfil e denúncias.
--
-- A matriz completa está em docs/CARGOS.md e em src/constants/roles.ts (espelho no app).
-- As regras valem no banco (RLS + gatilhos), independentemente do aplicativo.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Novo tipo de cargo (substitui app_role: admin -> developer, moderator -> administrator)
-- -----------------------------------------------------------------------------
create type public.member_role as enum ('developer', 'administrator');

alter table public.user_roles
  alter column role type public.member_role
  using (case role::text when 'admin' then 'developer' else 'administrator' end)::public.member_role;

drop type public.app_role;

-- Cada pessoa tem um único cargo (ausência de linha = empreendedora).
delete from public.user_roles a
 using public.user_roles b
 where a.user_id = b.user_id and a.role = 'administrator' and b.role = 'developer';
alter table public.user_roles drop constraint user_roles_pkey;
alter table public.user_roles add primary key (user_id);

comment on table public.user_roles is
  'Cargo da conta: developer (Desenvolvedor) ou administrator (Administradora). Sem linha = Empreendedora.';

-- -----------------------------------------------------------------------------
-- 2) Funções de cargo
-- -----------------------------------------------------------------------------
create or replace function public.my_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select r.role::text from public.user_roles r where r.user_id = auth.uid()),
    'entrepreneur'
  );
$$;

comment on function public.my_role() is
  'Cargo da usuária logada: developer, administrator ou entrepreneur.';

create or replace function public.is_developer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'developer');
$$;

-- "Equipe do Mural": desenvolvedor ou administradora (usado pelas políticas de moderação).
create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role in ('developer', 'administrator')
  );
$$;

revoke execute on function public.my_role(), public.is_developer() from public, anonymous;
grant execute on function public.my_role(), public.is_developer() to authenticated;

-- -----------------------------------------------------------------------------
-- 3) Perfis: quem cria, edita e exclui
-- -----------------------------------------------------------------------------
-- Equipe cadastra apenas perfis do grupo (sem conta); a própria conta usa profiles_insert_own.
drop policy "profiles_insert_moderation" on public.entrepreneur_profiles;
create policy "profiles_insert_moderation"
  on public.entrepreneur_profiles for insert
  to authenticated
  with check ((select public.is_moderator()) and user_id is null);

-- Desenvolvedor exclui qualquer perfil; administradora, só perfis do grupo (sem conta).
drop policy "profiles_delete_moderation" on public.entrepreneur_profiles;
create policy "profiles_delete_moderation"
  on public.entrepreneur_profiles for delete
  to authenticated
  using ((select public.is_developer()) or ((select public.is_moderator()) and user_id is null));

-- Edição: a política profiles_update_moderation continua liberando a equipe; o gatilho
-- abaixo impede a administradora de alterar o CONTEÚDO de perfis de outras empreendedoras
-- (ela pode apenas suspender/reativar).
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
    if new.user_id is distinct from old.user_id then
      raise exception 'Não é possível transferir o perfil para outra conta.';
    end if;
    new.id := old.id;
    new.created_at := old.created_at;

    -- Administradora: conteúdo de perfis de outras empreendedoras é somente leitura.
    if not full_access
       and old.user_id is not null
       and old.user_id is distinct from auth.uid()
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
-- 4) Gestão de cargos (somente desenvolvedor)
-- -----------------------------------------------------------------------------
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

create or replace function public.set_member_role(target_user_id uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_developer() then
    raise exception 'Apenas o desenvolvedor pode gerenciar cargos.' using errcode = '42501';
  end if;
  if target_user_id = auth.uid() then
    raise exception 'Você não pode alterar o próprio cargo.';
  end if;
  if new_role not in ('developer', 'administrator', 'entrepreneur') then
    raise exception 'Cargo inválido.';
  end if;
  if not exists (select 1 from public.users u where u.id = target_user_id) then
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

revoke execute on function public.list_members(text, integer), public.set_member_role(uuid, text) from public, anonymous;
grant execute on function public.list_members(text, integer), public.set_member_role(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 5) Denúncias abertas com o nome do perfil (painel da equipe no app)
-- -----------------------------------------------------------------------------
create or replace function public.list_open_reports(page_size integer default 50)
returns table (
  id uuid,
  profile_id uuid,
  business_name text,
  publication_status public.publication_status,
  reason public.report_reason,
  details text,
  status public.report_status,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  -- security invoker: a RLS de profile_reports já restringe à equipe do Mural.
  select r.id, r.profile_id, p.business_name, p.publication_status, r.reason, r.details, r.status, r.created_at
    from public.profile_reports r
    join public.entrepreneur_profiles p on p.id = r.profile_id
   where r.status in ('open', 'reviewing')
   order by r.created_at
   limit least(greatest(coalesce(page_size, 50), 1), 200);
$$;

revoke execute on function public.list_open_reports(integer) from public, anonymous;
grant execute on function public.list_open_reports(integer) to authenticated;
