-- =============================================================================
-- Ambiente mínimo que imita o Neon (Data API + Neon Auth) para testar as migrations
-- localmente com PGlite (Postgres em WebAssembly), sem precisar de um projeto real.
-- Usado apenas por database/tests/database.test.mjs — NÃO é uma migration.
-- =============================================================================

create role anonymous nologin noinherit;
create role authenticated nologin noinherit;
create role authenticator nologin noinherit;

create schema if not exists auth;
create schema if not exists neon_auth;

-- Como no Neon: as roles da API NÃO têm USAGE no schema auth. Só conseguem chamar auth.uid()
-- por referências já resolvidas (políticas, valores padrão) ou via funções security definer.

-- -----------------------------------------------------------------------------
-- neon_auth (versão simplificada da tabela de contas do Neon Auth / Better Auth)
-- -----------------------------------------------------------------------------
create table neon_auth."user" (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  email text not null,
  "emailVerified" boolean not null default false,
  "createdAt" timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- auth.uid() — no Neon vem da extensão pg_session_jwt (claim "sub" do JWT).
-- Aqui, lê o JWT simulado em request.jwt.claims.
-- -----------------------------------------------------------------------------
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub', '')::uuid;
$$;

grant execute on function auth.uid() to anonymous, authenticated;
