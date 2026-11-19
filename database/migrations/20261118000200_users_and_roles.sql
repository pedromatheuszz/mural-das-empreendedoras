-- =============================================================================
-- Contas (dados privados) e papéis administrativos
-- =============================================================================

-- -----------------------------------------------------------------------------
-- public.users — dados básicos da conta, ligados à conta do Neon Auth.
-- Senhas NUNCA ficam aqui: são gerenciadas exclusivamente pelo Neon Auth.
-- -----------------------------------------------------------------------------
create table public.users (
  id uuid primary key references neon_auth."user" (id) on delete cascade,
  full_name text not null,
  email text not null default '',
  terms_accepted_at timestamptz,
  terms_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_full_name_length check (char_length(full_name) between 1 and 120),
  constraint users_terms_version_length check (terms_version is null or char_length(terms_version) <= 20)
);

comment on table public.users is
  'Dados privados da conta. Visíveis apenas para a própria usuária. Senhas ficam somente no Neon Auth.';

create trigger users_set_updated_at
  before update on public.users
  for each row execute function private.set_updated_at();

alter table public.users enable row level security;

create policy "users_select_own"
  on public.users for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "users_update_own"
  on public.users for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Privilégios mínimos: a usuária só pode alterar o próprio nome.
-- A linha é criada/sincronizada pela função public.ensure_my_account().
revoke all on public.users from anonymous;
revoke insert, update, delete, truncate, references, trigger on public.users from authenticated;
grant select on public.users to authenticated;
grant update (full_name) on public.users to authenticated;

-- -----------------------------------------------------------------------------
-- public.ensure_my_account — cria (ou sincroniza) a linha da usuária logada.
-- O Neon Auth não permite triggers em neon_auth."user"; por isso o aplicativo chama
-- esta função logo após o cadastro/login. Nome e e-mail vêm da conta do Neon Auth.
-- p_terms_version registra o aceite dos Termos feito na tela de cadastro.
-- -----------------------------------------------------------------------------
create or replace function public.ensure_my_account(p_terms_version text default null)
returns public.users
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_uid uuid := auth.uid();
  auth_name text;
  auth_email text;
  clean_name text;
  accepted_version text := left(nullif(btrim(coalesce(p_terms_version, '')), ''), 20);
  result public.users;
begin
  if current_uid is null then
    raise exception 'Não autenticada.' using errcode = '42501';
  end if;

  select u.name, u.email into auth_name, auth_email
  from neon_auth."user" u
  where u.id = current_uid;

  if not found then
    raise exception 'Conta não encontrada.' using errcode = 'P0002';
  end if;

  clean_name := nullif(btrim(regexp_replace(coalesce(auth_name, ''), '\s+', ' ', 'g')), '');

  insert into public.users (id, full_name, email, terms_accepted_at, terms_version)
  values (
    current_uid,
    left(coalesce(clean_name, nullif(split_part(coalesce(auth_email, ''), '@', 1), ''), 'Empreendedora'), 120),
    coalesce(auth_email, ''),
    case when accepted_version is not null then now() end,
    accepted_version
  )
  on conflict (id) do update
    set email = excluded.email,
        terms_accepted_at = coalesce(public.users.terms_accepted_at, excluded.terms_accepted_at),
        terms_version = coalesce(public.users.terms_version, excluded.terms_version)
  returning * into result;

  return result;
end;
$$;

revoke execute on function public.ensure_my_account(text) from public, anonymous;
grant execute on function public.ensure_my_account(text) to authenticated;

-- -----------------------------------------------------------------------------
-- Papéis administrativos (preparação para o futuro painel web de moderação).
-- Atribuídos apenas via SQL (dona do banco) — nunca pelo aplicativo.
-- -----------------------------------------------------------------------------
create table public.user_roles (
  user_id uuid not null references neon_auth."user" (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

alter table public.user_roles enable row level security;

create policy "user_roles_select_own"
  on public.user_roles for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.user_roles from anonymous;
revoke insert, update, delete, truncate, references, trigger on public.user_roles from authenticated;

create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles r
    where r.user_id = auth.uid()
      and r.role in ('admin', 'moderator')
  );
$$;

revoke execute on function public.is_moderator() from public, anonymous;
grant execute on function public.is_moderator() to authenticated;
