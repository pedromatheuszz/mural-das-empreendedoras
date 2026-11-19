-- =============================================================================
-- Perfis cadastrados pela organização (curadoria do grupo)
--
-- Permite que a moderação/organização publique perfis de empreendedoras que ainda
-- não têm conta no app (user_id nulo). Esses perfis aparecem normalmente no Mural,
-- podem ser denunciados e só são editados pela moderação ou via SQL.
-- =============================================================================

alter table public.entrepreneur_profiles alter column user_id drop not null;

comment on column public.entrepreneur_profiles.user_id is
  'Conta dona do perfil. Nulo = perfil cadastrado pela organização (curadoria).';

-- A moderação pode criar e excluir perfis (futuro painel administrativo).
create policy "profiles_insert_moderation"
  on public.entrepreneur_profiles for insert
  to authenticated
  with check ((select public.is_moderator()));

create policy "profiles_delete_moderation"
  on public.entrepreneur_profiles for delete
  to authenticated
  using ((select public.is_moderator()));

-- Denúncias: "p.user_id <> auth.uid()" não funciona com user_id nulo; usa IS DISTINCT FROM.
drop policy "reports_insert_authenticated" on public.profile_reports;

create policy "reports_insert_authenticated"
  on public.profile_reports for insert
  to authenticated
  with check (
    reporter_id = (select auth.uid())
    and status = 'open'
    and resolution_note is null
    and resolved_at is null
    and exists (
      select 1
      from public.entrepreneur_profiles p
      where p.id = profile_reports.profile_id
        and p.publication_status = 'published'
        and p.user_id is distinct from (select auth.uid())
    )
  );
