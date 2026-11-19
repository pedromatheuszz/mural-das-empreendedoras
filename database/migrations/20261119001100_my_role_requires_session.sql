-- =============================================================================
-- my_role() nunca responde "entrepreneur" por engano.
--
-- Raramente, a Data API do Neon executa uma requisição sem a sessão do JWT carregada
-- (auth.uid() nulo). Antes, my_role() devolvia "entrepreneur" nesse caso e o app guardava
-- o cargo errado. Agora a função dá erro (o app tenta de novo).
-- =============================================================================

create or replace function public.my_role()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_uid uuid := auth.uid();
begin
  if current_uid is null then
    raise exception 'Sessão não identificada. Tente novamente.' using errcode = '42501';
  end if;
  return coalesce(
    (select r.role::text from public.user_roles r where r.user_id = current_uid),
    'entrepreneur'
  );
end;
$$;
