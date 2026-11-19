-- =============================================================================
-- Correção: o gatilho de perfis roda com as permissões da usuária (role authenticated),
-- que no Neon não tem acesso ao schema "auth". Em vez de chamar auth.uid() direto,
-- o gatilho usa public.current_account_id() (security definer).
-- =============================================================================

create or replace function public.current_account_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid();
$$;

comment on function public.current_account_id() is 'Id da conta logada (auth.uid()), acessível às funções do app.';

revoke execute on function public.current_account_id() from public, anonymous;
grant execute on function public.current_account_id() to authenticated;

create or replace function private.entrepreneur_profiles_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  is_db_owner constant boolean := current_user not in ('anonymous', 'authenticated', 'authenticator');
  -- dona do banco (SQL) e equipe do Mural podem suspender/reativar perfis.
  privileged constant boolean := is_db_owner or public.is_moderator();
  full_access constant boolean := is_db_owner or public.is_developer();
  status_fields constant text[] := array[
    'publication_status', 'suspension_reason', 'suspended_at', 'published_at', 'updated_at', 'sort_name', 'search_text'
  ];
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

    -- Administradora: conteúdo de perfis de outras empreendedoras é somente leitura.
    if not full_access
       and old.user_id is not null
       and old.user_id is distinct from public.current_account_id()
       and (to_jsonb(new) - status_fields) is distinct from (to_jsonb(old) - status_fields) then
      raise exception 'Somente a dona do perfil (ou o desenvolvedor) pode editar este conteúdo. A administração pode apenas suspender ou reativar.'
        using errcode = 'P0001';
    end if;

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
