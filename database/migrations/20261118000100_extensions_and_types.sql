-- =============================================================================
-- Mural das Empreendedoras — extensões, tipos e funções utilitárias
-- =============================================================================

-- Banco: Neon (Postgres). Login: Neon Auth (contas em neon_auth."user").
-- A Data API do Neon (PostgREST) acessa o banco com as roles "anonymous" e "authenticated";
-- auth.uid() vem da extensão pg_session_jwt, a partir do JWT do Neon Auth.

create schema if not exists extensions;
grant usage on schema extensions to anonymous, authenticated;

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- Schema privado: funções internas (triggers) que não devem ser expostas pela API.
create schema if not exists private;
revoke all on schema private from public;

-- Privilégios-base das roles da Data API nos objetos criados a seguir. Cada migration
-- retira o que não for necessário, e a RLS decide quais linhas cada usuária enxerga.
grant usage on schema public to anonymous, authenticated;
alter default privileges in schema public grant all on tables to anonymous, authenticated;
alter default privileges in schema public grant all on sequences to anonymous, authenticated;
alter default privileges in schema public grant execute on functions to anonymous, authenticated;

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------
create type public.publication_status as enum ('draft', 'published', 'unpublished', 'suspended');
comment on type public.publication_status is
  'draft = rascunho; published = visível no Mural; unpublished = retirado pela empreendedora; suspended = suspenso pela moderação.';

create type public.app_role as enum ('admin', 'moderator');

create type public.report_reason as enum ('spam', 'inappropriate', 'fake', 'scam', 'other');

create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');

-- -----------------------------------------------------------------------------
-- Funções utilitárias
-- -----------------------------------------------------------------------------

-- Normaliza texto para busca: minúsculas e sem acentos ("Estética" -> "estetica").
-- Declarada IMMUTABLE para poder ser usada em colunas geradas e índices.
create or replace function public.normalize_search_text(value text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(value, '')));
$$;

-- Escapa curingas do LIKE (% e _) digitados pela usuária.
create or replace function public.escape_like(value text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select replace(replace(replace(coalesce(value, ''), '\', '\\'), '%', '\%'), '_', '\_');
$$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
