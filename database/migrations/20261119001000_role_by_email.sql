-- =============================================================================
-- Gestão de cargos pela API
--
-- - set_member_role passa a aceitar contas que já existem no Neon Auth mas ainda não
--   abriram o app (sem linha em public.users).
-- - set_member_role_by_email: promove/rebaixa pelo e-mail (Data API: POST /rpc/set_member_role_by_email).
-- Ambas exigem o cargo de desenvolvedor (validado aqui no banco).
-- =============================================================================

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

create or replace function public.set_member_role_by_email(target_email text, new_role text)
returns table (id uuid, email text, role text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid;
begin
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

revoke execute on function public.set_member_role_by_email(text, text) from public, anonymous;
grant execute on function public.set_member_role_by_email(text, text) to authenticated;
