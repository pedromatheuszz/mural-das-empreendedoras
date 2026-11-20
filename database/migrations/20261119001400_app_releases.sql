-- =============================================================================
-- Atualização do app pela API
--
-- O desenvolvedor publica cada nova versão (npm run release → publish_app_release).
-- O app consulta latest_app_release ao abrir e ao voltar para a frente:
--   - versão instalada < min_supported_version → atualização OBRIGATÓRIA (tela bloqueada);
--   - versão instalada < version              → atualização disponível (aviso opcional).
-- A leitura é pública (inclusive antes do login, com o token anônimo do Neon Auth).
-- =============================================================================

create table public.app_releases (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  version text not null,
  min_supported_version text not null,
  download_url text not null,
  release_notes text,
  published_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint app_releases_platform_valid check (platform in ('android', 'ios')),
  constraint app_releases_version_format check (version ~ '^\d{1,4}\.\d{1,4}\.\d{1,4}$'),
  constraint app_releases_min_version_format check (min_supported_version ~ '^\d{1,4}\.\d{1,4}\.\d{1,4}$'),
  constraint app_releases_min_not_above check (
    string_to_array(min_supported_version, '.')::int[] <= string_to_array(version, '.')::int[]
  ),
  constraint app_releases_url_format check (download_url ~* '^https://\S+$' and char_length(download_url) <= 500),
  constraint app_releases_notes_length check (release_notes is null or char_length(release_notes) <= 1000),
  constraint app_releases_unique_version unique (platform, version)
);

comment on table public.app_releases is
  'Versões publicadas do app. A mais recente de cada plataforma define o aviso de atualização.';

alter table public.app_releases enable row level security;

create policy "app_releases_select_all"
  on public.app_releases for select
  to anonymous, authenticated
  using (true);

-- Escrita só pela função de publicação (somente desenvolvedor).
revoke insert, update, delete, truncate, references, trigger on public.app_releases from anonymous, authenticated;
grant select on public.app_releases to anonymous, authenticated;

-- Última versão publicada de uma plataforma (ordem numérica: 1.0.10 > 1.0.9).
create or replace function public.latest_app_release(target_platform text)
returns table (
  version text,
  min_supported_version text,
  download_url text,
  release_notes text,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select r.version, r.min_supported_version, r.download_url, r.release_notes, r.created_at
    from public.app_releases r
   where r.platform = target_platform
   order by string_to_array(r.version, '.')::int[] desc
   limit 1;
$$;

revoke execute on function public.latest_app_release(text) from public;
grant execute on function public.latest_app_release(text) to anonymous, authenticated;

-- Publica uma nova versão. Sem min_version, a atualização é obrigatória (min = a própria versão).
create or replace function public.publish_app_release(
  target_platform text,
  new_version text,
  url text,
  notes text default null,
  min_version text default null
)
returns public.app_releases
language plpgsql
security definer
set search_path = ''
as $$
declare
  latest text;
  result public.app_releases;
begin
  if auth.uid() is null then
    raise exception 'Sessão não identificada. Tente novamente.' using errcode = '42501';
  end if;
  if not public.is_developer() then
    raise exception 'Apenas o desenvolvedor pode publicar versões do app.' using errcode = '42501';
  end if;

  select r.version into latest
    from public.app_releases r
   where r.platform = target_platform
   order by string_to_array(r.version, '.')::int[] desc
   limit 1;

  if latest is not null and string_to_array(new_version, '.')::int[] <= string_to_array(latest, '.')::int[] then
    raise exception 'A versão % precisa ser maior que a última publicada (%).', new_version, latest;
  end if;

  insert into public.app_releases (platform, version, min_supported_version, download_url, release_notes, published_by)
  values (
    target_platform,
    btrim(new_version),
    btrim(coalesce(min_version, new_version)),
    btrim(url),
    nullif(left(btrim(coalesce(notes, '')), 1000), ''),
    auth.uid()
  )
  returning * into result;

  return result;
end;
$$;

revoke execute on function public.publish_app_release(text, text, text, text, text) from public, anonymous;
grant execute on function public.publish_app_release(text, text, text, text, text) to authenticated;
