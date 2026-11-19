-- =============================================================================
-- Perfis empresariais (o coração do Mural)
-- =============================================================================

create table public.entrepreneur_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,

  business_name text not null,
  entrepreneur_name text not null,
  service_description text not null,

  logo_url text,
  profile_image_url text,
  category text,
  city text,
  state text,
  instagram_url text,
  website_url text,
  contact_url text,
  serves_nationwide boolean not null default false,
  community_perks text[] not null default '{}',

  publication_status public.publication_status not null default 'draft',
  public_consent_at timestamptz,
  published_at timestamptz,
  suspended_at timestamptz,
  suspension_reason text,

  -- Colunas derivadas para ordenação e busca sem acentos.
  sort_name text generated always as (public.normalize_search_text(business_name)) stored,
  search_text text generated always as (
    public.normalize_search_text(
      business_name || ' ' || entrepreneur_name || ' ' || service_description || ' ' ||
      coalesce(category, '') || ' ' || coalesce(city, '')
    )
  ) stored,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint entrepreneur_profiles_business_name_length
    check (char_length(business_name) between 2 and 80),
  constraint entrepreneur_profiles_entrepreneur_name_length
    check (char_length(entrepreneur_name) between 2 and 80),
  constraint entrepreneur_profiles_service_description_length
    check (char_length(service_description) between 20 and 1500),
  constraint entrepreneur_profiles_category_format
    check (category is null or category ~ '^[a-z0-9-]{2,40}$'),
  constraint entrepreneur_profiles_city_length
    check (city is null or char_length(city) between 2 and 80),
  constraint entrepreneur_profiles_state_format
    check (state is null or state ~ '^[A-Z]{2}$'),
  constraint entrepreneur_profiles_logo_url_format
    check (logo_url is null or (logo_url ~* '^https?://\S+$' and char_length(logo_url) <= 500)),
  constraint entrepreneur_profiles_profile_image_url_format
    check (profile_image_url is null or (profile_image_url ~* '^https?://\S+$' and char_length(profile_image_url) <= 500)),
  constraint entrepreneur_profiles_instagram_url_format
    check (instagram_url is null or (instagram_url ~* '^https?://\S+$' and char_length(instagram_url) <= 300)),
  constraint entrepreneur_profiles_website_url_format
    check (website_url is null or (website_url ~* '^https?://\S+$' and char_length(website_url) <= 300)),
  constraint entrepreneur_profiles_contact_url_format
    check (contact_url is null or (contact_url ~* '^https?://\S+$' and char_length(contact_url) <= 300)),
  constraint entrepreneur_profiles_perks_valid
    check (
      cardinality(community_perks) <= 5
      and community_perks <@ array['priority-service', 'free-quote', 'free-first-talk', 'local-delivery', 'hub-discount']::text[]
    ),
  constraint entrepreneur_profiles_suspension_reason_length
    check (suspension_reason is null or char_length(suspension_reason) <= 500),
  -- Publicar exige consentimento explícito para divulgação pública (LGPD).
  constraint entrepreneur_profiles_published_requires_consent
    check (publication_status <> 'published' or public_consent_at is not null)
);

comment on table public.entrepreneur_profiles is
  'Perfis empresariais. Leitura pública apenas quando publication_status = published.';
comment on column public.entrepreneur_profiles.public_consent_at is
  'Momento (horário do servidor) em que a empreendedora autorizou a divulgação pública do perfil.';
comment on column public.entrepreneur_profiles.published_at is
  'Primeira publicação no Mural (usada em "Recém-chegadas"; não muda ao republicar).';

-- -----------------------------------------------------------------------------
-- Índices
-- -----------------------------------------------------------------------------

-- MVP: uma conta = um perfil empresarial. Para permitir vários negócios por conta
-- no futuro, basta remover este índice único (o app já trabalha com o id do perfil).
create unique index entrepreneur_profiles_one_per_user_idx
  on public.entrepreneur_profiles (user_id);

create index entrepreneur_profiles_listing_idx
  on public.entrepreneur_profiles (sort_name, id)
  where publication_status = 'published';

create index entrepreneur_profiles_recent_idx
  on public.entrepreneur_profiles (published_at desc, id)
  where publication_status = 'published';

create index entrepreneur_profiles_category_idx
  on public.entrepreneur_profiles (category, sort_name, id)
  where publication_status = 'published';

-- Busca textual (marca, empreendedora, serviços e descrição) por trigramas.
create index entrepreneur_profiles_search_trgm_idx
  on public.entrepreneur_profiles using gin (search_text extensions.gin_trgm_ops);

create index entrepreneur_profiles_business_name_trgm_idx
  on public.entrepreneur_profiles using gin (sort_name extensions.gin_trgm_ops);

create index entrepreneur_profiles_entrepreneur_name_trgm_idx
  on public.entrepreneur_profiles using gin (public.normalize_search_text(entrepreneur_name) extensions.gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- Regras de negócio no banco (independentes do app)
-- -----------------------------------------------------------------------------
create or replace function private.entrepreneur_profiles_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  -- dona do banco (painel administrativo, SQL) e moderadoras são privilegiadas.
  privileged constant boolean := current_user not in ('anonymous', 'authenticated', 'authenticator') or public.is_moderator();
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

create trigger entrepreneur_profiles_before_write
  before insert or update on public.entrepreneur_profiles
  for each row execute function private.entrepreneur_profiles_before_write();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.entrepreneur_profiles enable row level security;

-- Qualquer pessoa (inclusive sem login) pode ler perfis publicados.
create policy "profiles_select_published"
  on public.entrepreneur_profiles for select
  to anonymous, authenticated
  using (publication_status = 'published');

-- A empreendedora vê o próprio perfil em qualquer status.
create policy "profiles_select_own"
  on public.entrepreneur_profiles for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "profiles_select_moderation"
  on public.entrepreneur_profiles for select
  to authenticated
  using ((select public.is_moderator()));

create policy "profiles_insert_own"
  on public.entrepreneur_profiles for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "profiles_update_own"
  on public.entrepreneur_profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "profiles_update_moderation"
  on public.entrepreneur_profiles for update
  to authenticated
  using ((select public.is_moderator()))
  with check ((select public.is_moderator()));

create policy "profiles_delete_own"
  on public.entrepreneur_profiles for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke insert, update, delete, truncate, references, trigger on public.entrepreneur_profiles from anonymous;
revoke truncate, references, trigger on public.entrepreneur_profiles from authenticated;

-- -----------------------------------------------------------------------------
-- Busca de empreendedoras
-- Pesquisa por marca, nome da empreendedora, serviços/descrição, categoria e cidade,
-- sem diferenciar acentos/maiúsculas. Todos os termos digitados precisam aparecer.
-- SECURITY INVOKER: as políticas de RLS acima continuam valendo.
-- -----------------------------------------------------------------------------
create or replace function public.search_entrepreneur_profiles(
  search_query text default '',
  category_filter text default null,
  page_size integer default 20,
  page_offset integer default 0
)
returns setof public.entrepreneur_profiles
language sql
stable
security invoker
set search_path = ''
as $$
  with params as (
    select public.normalize_search_text(btrim(left(coalesce(search_query, ''), 100))) as q
  ),
  terms as (
    select coalesce(
      array(
        select '%' || public.escape_like(term) || '%'
        from unnest(regexp_split_to_array((select q from params), '\s+')) as term
        where term <> ''
      ),
      '{}'
    ) as patterns
  )
  select p.*
  from public.entrepreneur_profiles p
  cross join params
  cross join terms
  where p.publication_status = 'published'
    and (nullif(category_filter, '') is null or p.category = category_filter)
    and p.search_text like all (terms.patterns)
  order by
    case
      when params.q = '' then 0
      when p.sort_name like public.escape_like(params.q) || '%' then 0
      when p.sort_name like '%' || public.escape_like(params.q) || '%' then 1
      when public.normalize_search_text(p.entrepreneur_name) like '%' || public.escape_like(params.q) || '%' then 2
      else 3
    end,
    p.sort_name,
    p.id
  limit least(greatest(coalesce(page_size, 20), 1), 50)
  offset greatest(coalesce(page_offset, 0), 0);
$$;

comment on function public.search_entrepreneur_profiles(text, text, integer, integer) is
  'Busca paginada de perfis publicados (máx. 50 por página).';
