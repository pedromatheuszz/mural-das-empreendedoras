# Cargos e permissões

O app tem três cargos:

| Cargo | Para quem | Como recebe |
| --- | --- | --- |
| **Desenvolvedor** | quem mantém o app | `npm run dev:account` (conta de desenvolvedor) ou outro desenvolvedor pelo app |
| **Administradora** | admins do grupo Joinville Empreendedoras | o desenvolvedor, em Meu Perfil → Painel da equipe → Cargos e permissões |
| **Empreendedora** | todas as demais integrantes | padrão de toda conta nova (não precisa fazer nada) |

## O que cada cargo pode fazer

| Permissão | Desenvolvedor | Administradora | Empreendedora |
| --- | :-: | :-: | :-: |
| Ver o Mural, buscar e denunciar perfis | ✓ | ✓ | ✓ |
| Criar, editar, publicar e excluir o **próprio** perfil | ✓ | ✓ | ✓ |
| Ver perfis fora do Mural (rascunhos, retirados, suspensos) | ✓ | ✓ | – |
| Suspender e reativar **qualquer** perfil | ✓ | ✓ | – |
| Ver e resolver denúncias | ✓ | ✓ | – |
| Ver o histórico de alterações dos perfis | ✓ | ✓ | – |
| Editar e excluir os **perfis do grupo** (cadastrados pela organização, sem conta) | ✓ | ✓ | – |
| Editar o conteúdo do perfil de **outra empreendedora** | ✓ | – | – |
| Excluir o perfil de **outra empreendedora** | ✓ | – | – |
| Atribuir e remover cargos | ✓ | – | – |

Regras extras:

- **Próprio cargo:** ninguém altera o próprio cargo. Isso evita que o último desenvolvedor se rebaixe por engano.
- **Suspensão:** quando a equipe suspende um perfil, a dona vê o motivo e não consegue reativá-lo sozinha.
- **Histórico:** toda ação da equipe fica registrada em `profile_audit_log`.

## Onde fica no app

- **Meu Perfil:** mostra o selo do cargo. Para a equipe, aparece também a seção **Equipe do Mural → Painel da
  equipe**.
- **Painel da equipe:** traz as denúncias abertas, com os botões "Ver e moderar perfil", "Resolvida" e "Descartar". Para
  o desenvolvedor, inclui também **Cargos e permissões**.
- **Perfil de uma empreendedora:** a equipe vê um botão com escudo no topo, que abre **Gerenciar perfil**. Lá estão
  editar conteúdo, suspender/reativar e excluir, mostrados conforme o cargo.

## Onde fica no código

- **Banco (é quem garante as regras):**
  - [`20261119000800_member_roles.sql`](../database/migrations/20261119000800_member_roles.sql) define a tabela
    `user_roles`, as funções `my_role()`, `is_developer()`, `is_moderator()`, `list_members()`, `set_member_role()` e
    `list_open_reports()`, as políticas de RLS e o gatilho que impede a administradora de editar o conteúdo de perfis
    de outras empreendedoras.
  - Os testes ficam em `database/tests/database.test.mjs`, no teste "cargos".
- **App (só mostra ou esconde botões):**
  - [`src/constants/roles.ts`](../src/constants/roles.ts) é o espelho da matriz acima. Mudar um cargo exige mudar a
    migration (nova migration) **e** esse arquivo.
  - O hook `usePermissions()` fica em `src/hooks/use-permissions.ts`.

## Pela API

As funções de cargo ficam expostas na Data API do Neon e exigem o JWT de uma conta com cargo de **desenvolvedor**.
O banco confere o cargo a cada chamada; para qualquer outra conta, a resposta é "Apenas o desenvolvedor pode gerenciar
cargos".

### Pelo terminal (recomendado)

```powershell
npm run role -- email@exemplo.com administradora
```

```powershell
npm run role -- --list
```

- **Cargos aceitos:** `desenvolvedor`, `administradora` ou `empreendedora` (empreendedora remove o cargo).
- **Credenciais:** o comando entra pelo Neon Auth com `ROLE_ADMIN_EMAIL` / `ROLE_ADMIN_PASSWORD` do `.env`. Se essas
  variáveis não existirem, usa o login de desenvolvedor (`EXPO_PUBLIC_DEV_LOGIN_*`).
- **Contas novas:** a pessoa só precisa ter se cadastrado. Não é preciso ter confirmado o e-mail nem aberto o app.

### Chamando a API diretamente

1. Entre no Neon Auth: `POST {EXPO_PUBLIC_NEON_AUTH_URL}/sign-in/email` com `{ "email", "password" }` e o cabeçalho
   `Origin` igual ao domínio do Neon Auth. Guarde o cookie `__Secure-neon-auth.session_token`.
2. Troque a sessão por um JWT: `GET {EXPO_PUBLIC_NEON_AUTH_URL}/token` com esse cookie. A resposta é
   `{ "token": "..." }`, válido por 15 minutos.
3. Chame a Data API com `Authorization: Bearer <token>`:

| Ação | Requisição | Corpo |
| --- | --- | --- |
| Mudar cargo por e-mail | `POST {EXPO_PUBLIC_NEON_DATA_API_URL}/rpc/set_member_role_by_email` | `{ "target_email": "email@exemplo.com", "new_role": "administrator" }` |
| Mudar cargo por id | `POST .../rpc/set_member_role` | `{ "target_user_id": "uuid", "new_role": "developer" }` |
| Listar contas e cargos | `POST .../rpc/list_members` | `{ "search": "", "page_size": 100 }` |
| Ver o próprio cargo | `POST .../rpc/my_role` | `{}` |

Na API, `new_role` usa os valores `developer`, `administrator` e `entrepreneur`.

## Pelo SQL (alternativa ao app)

```sql
-- Tornar alguém administradora (a conta precisa já existir no app)
insert into public.user_roles (user_id, role)
select id, 'administrator' from public.users where email = 'email@exemplo.com'
on conflict (user_id) do update set role = excluded.role;

-- Voltar a ser empreendedora
delete from public.user_roles where user_id = (select id from public.users where email = 'email@exemplo.com');
```
