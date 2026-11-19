-- =============================================================================
-- Exclusão de conta solicitada pela própria usuária (LGPD art. 18, VI;
-- exigência da Apple App Store 5.1.1(v) e do Google Play).
--
-- Remove a conta do Neon Auth e, em cascata: public.users, perfil empresarial
-- e papéis. Denúncias feitas pela usuária permanecem anonimizadas (reporter_id = null)
-- e o registro de auditoria mantém apenas metadados técnicos, sem dados pessoais.
-- As imagens no Cloudinary são removidas pelo script scripts/cloudinary-cleanup.mjs
-- (pastas de contas que não existem mais), pois exigem a chave secreta do Cloudinary.
-- =============================================================================

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_uid uuid := auth.uid();
begin
  if current_uid is null then
    raise exception 'Sessão inválida. Entre novamente para excluir a conta.';
  end if;

  delete from neon_auth."user" where id = current_uid;
end;
$$;

comment on function public.delete_my_account() is
  'Exclui definitivamente a conta da usuária autenticada e os dados associados.';

revoke execute on function public.delete_my_account() from public, anonymous;
grant execute on function public.delete_my_account() to authenticated;
