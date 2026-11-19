-- =============================================================================
-- Moderação: registro de alterações, denúncias e suspensão de perfis
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Registro de alterações relevantes (sem conteúdo pessoal, apenas metadados).
-- -----------------------------------------------------------------------------
create table public.profile_audit_log (
  id bigint generated always as identity primary key,
  profile_id uuid not null,
  actor_id uuid,
  action text not null,
  old_status public.publication_status,
  new_status public.publication_status,
  changed_fields text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint profile_audit_log_action_valid
    check (action in ('created', 'updated', 'status_changed', 'deleted'))
);

comment on table public.profile_audit_log is
  'Histórico de criação, edição, mudança de status e exclusão de perfis. Leitura restrita à moderação.';

create index profile_audit_log_profile_idx
  on public.profile_audit_log (profile_id, created_at desc);

alter table public.profile_audit_log enable row level security;

create policy "audit_select_moderation"
  on public.profile_audit_log for select
  to authenticated
  using ((select public.is_moderator()));

revoke all on public.profile_audit_log from anonymous;
revoke insert, update, delete, truncate, references, trigger on public.profile_audit_log from authenticated;

create or replace function private.entrepreneur_profiles_after_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed text[];
begin
  if tg_op = 'INSERT' then
    insert into public.profile_audit_log (profile_id, actor_id, action, new_status)
    values (new.id, auth.uid(), 'created', new.publication_status);
    return new;
  end if;

  if tg_op = 'UPDATE' then
    select coalesce(array_agg(n.key order by n.key), '{}')
      into changed
      from jsonb_each(to_jsonb(new)) as n
     where n.key not in ('updated_at', 'sort_name', 'search_text')
       and n.value is distinct from (to_jsonb(old) -> n.key);

    if cardinality(changed) > 0 then
      insert into public.profile_audit_log (profile_id, actor_id, action, old_status, new_status, changed_fields)
      values (
        new.id,
        auth.uid(),
        case when new.publication_status is distinct from old.publication_status then 'status_changed' else 'updated' end,
        old.publication_status,
        new.publication_status,
        changed
      );
    end if;
    return new;
  end if;

  insert into public.profile_audit_log (profile_id, actor_id, action, old_status)
  values (old.id, auth.uid(), 'deleted', old.publication_status);
  return old;
end;
$$;

create trigger entrepreneur_profiles_audit
  after insert or update or delete on public.entrepreneur_profiles
  for each row execute function private.entrepreneur_profiles_after_write();

-- -----------------------------------------------------------------------------
-- Denúncias de perfis
-- -----------------------------------------------------------------------------
create table public.profile_reports (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.entrepreneur_profiles (id) on delete cascade,
  reporter_id uuid default auth.uid() references public.users (id) on delete set null,
  reason public.report_reason not null,
  details text,
  status public.report_status not null default 'open',
  resolution_note text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint profile_reports_details_length
    check (details is null or char_length(details) <= 1000),
  constraint profile_reports_resolution_note_length
    check (resolution_note is null or char_length(resolution_note) <= 1000)
);

comment on table public.profile_reports is
  'Denúncias feitas pelas usuárias. Analisadas pela moderação (futuro painel web).';

create index profile_reports_status_idx on public.profile_reports (status, created_at desc);
create index profile_reports_profile_idx on public.profile_reports (profile_id);

-- Evita denúncias repetidas da mesma pessoa enquanto a anterior está em aberto.
create unique index profile_reports_one_open_per_reporter_idx
  on public.profile_reports (profile_id, reporter_id)
  where status in ('open', 'reviewing');

alter table public.profile_reports enable row level security;

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
        and p.user_id <> (select auth.uid())
    )
  );

create policy "reports_select_own"
  on public.profile_reports for select
  to authenticated
  using (reporter_id = (select auth.uid()));

create policy "reports_select_moderation"
  on public.profile_reports for select
  to authenticated
  using ((select public.is_moderator()));

create policy "reports_update_moderation"
  on public.profile_reports for update
  to authenticated
  using ((select public.is_moderator()))
  with check ((select public.is_moderator()));

revoke all on public.profile_reports from anonymous;
revoke delete, truncate, references, trigger on public.profile_reports from authenticated;

-- -----------------------------------------------------------------------------
-- Ação de moderação (para o futuro painel administrativo web).
-- -----------------------------------------------------------------------------
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

revoke execute on function public.moderate_profile(uuid, public.publication_status, text) from public, anonymous;
grant execute on function public.moderate_profile(uuid, public.publication_status, text) to authenticated;
