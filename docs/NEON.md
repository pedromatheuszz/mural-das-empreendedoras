# Configurando o Neon e o Cloudinary

O app usa:

- **Neon (Postgres)**: o banco de dados, com as regras de segurança (RLS).
- **Neon Auth**: cadastro, login, confirmação de e-mail por código e recuperação de senha.
- **Data API do Neon**: compatível com PostgREST, é por onde o app lê e grava os dados.
- **Cloudinary**: guarda os logotipos e as fotos dos perfis.

O projeto Neon atual é **Mural das Empreendedoras**, na região São Paulo (`sa-east-1`).

## 1. Variáveis de ambiente (`.env`, nunca versionado)

| Variável | Onde fica | O que é |
| --- | --- | --- |
| `NEON_DATABASE_URL` | só scripts | String de conexão da dona do banco. **Segredo** (ignora a RLS). |
| `NEON_API_KEY` | só scripts | Chave da API do Neon. **Segredo.** |
| `CLOUDINARY_URL` | só scripts | `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`. **Segredo.** |
| `EXPO_PUBLIC_NEON_AUTH_URL` | app | Neon Console → Auth → endereço do Auth. |
| `EXPO_PUBLIC_NEON_DATA_API_URL` | app | Neon Console → Data API → endereço da API (termina em `/rest/v1`). |
| `EXPO_PUBLIC_NEON_AUTH_ORIGIN` | app | Opcional. Origem enviada ao Neon Auth (padrão: o próprio domínio do Auth). |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` | app | Nome da nuvem do Cloudinary (minúsculas, ex.: `dmural123`). |
| `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | app | Nome de um upload preset **não assinado**. |
| `EXPO_PUBLIC_DEV_LOGIN_EMAIL` / `_PASSWORD` | app (só dev) | Login de desenvolvedor (seção 5). |

Tudo que começa com `EXPO_PUBLIC_` é embutido no aplicativo e qualquer pessoa pode ler. Por isso nunca coloque ali
a string do banco, a API Secret do Cloudinary ou a chave do Neon. O app detecta alguns desses erros e mostra um
aviso. Nos builds do EAS, cadastre as variáveis `EXPO_PUBLIC_` nos ambientes do EAS.

## 2. Banco: tabelas, regras de segurança e dados do grupo

As migrations ficam em `database/migrations/` e criam:

- as tabelas, a busca sem acentos e as políticas de RLS;
- a moderação e o registro de auditoria;
- as funções `ensure_my_account` e `delete_my_account`.

Para aplicar as pendentes e carregar os 85 perfis do grupo (o seed é idempotente):

```powershell
npm run db:migrate -- --seed
```

O controle do que já foi aplicado fica na tabela `private.schema_migrations`. Toda mudança de schema segue três
passos:

1. Criar uma migration nova.
2. Atualizar `src/types/database.ts`.
3. Escrever os testes em `database/tests/database.test.mjs`.

Os testes rodam em um Postgres embutido (PGlite) que simula o Neon: `npm run test:db`.

### Como a segurança funciona

- O app manda o JWT do Neon Auth para a Data API. O banco recebe a requisição com a role `authenticated`, e
  `auth.uid()` devolve o id da conta.
- As contas ficam em `neon_auth."user"`. Como o Neon Auth não permite triggers ali, o app chama
  `public.ensure_my_account()` depois do login. Essa função cria ou sincroniza a linha em `public.users` e registra
  o aceite dos Termos.
- `delete_my_account()` apaga a conta do Neon Auth. Em cascata, somem os dados, o perfil e os papéis da usuária.

## 3. Neon Auth

Já está configurado assim (Neon Console → Auth):

- e-mail e senha com **confirmação obrigatória por código** (OTP), enviado no cadastro e ao tentar entrar sem
  confirmar;
- recuperação de senha por código;
- outras sessões encerradas quando a senha é redefinida.

Observações:

- **Remetente dos e-mails**: hoje é o remetente compartilhado do Neon (`auth@mail.myneon.app`). Antes de publicar,
  configure um SMTP próprio em Auth → Email provider.
- **Troca de e-mail**: não é suportada pelo Neon Auth. O app orienta a falar com o suporte.
- **Origem**: o app envia o cabeçalho `Origin` com o próprio domínio do Neon Auth, que o servidor aceita. Se quiser
  usar um domínio seu, cadastre-o em Auth → Domains e defina `EXPO_PUBLIC_NEON_AUTH_ORIGIN`.

## 4. Cloudinary (imagens)

1. Crie uma conta em [cloudinary.com](https://cloudinary.com). O plano gratuito basta para o MVP.
2. Em **Settings → Upload → Upload presets**, crie um preset com:
   - **Signing mode: Unsigned**;
   - pasta `mural`;
   - formatos permitidos `jpg, png, webp`;
   - tamanho máximo de 5 MB.
3. Preencha `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` (o **Cloud name** do painel, não a API Key nem a API Secret) e
   `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
4. Para os scripts, copie a **API environment variable** (`cloudinary://...`) para `CLOUDINARY_URL`.

O app envia cada imagem para `mural/users/<id da conta>/`. Imagens substituídas ou de contas excluídas só podem ser
apagadas com a API Secret, então essa limpeza é feita fora do app, por quem administra o serviço.

### Fotos do grupo

```powershell
npm run photos:fetch
```

```powershell
npm run photos:upload
```

O primeiro comando baixa as fotos públicas do Instagram uma única vez. O segundo envia as fotos para
`mural/curated/` e preenche `logo_url` nos perfis.

## 5. Login de desenvolvedor

Preencha `EXPO_PUBLIC_DEV_LOGIN_EMAIL` e `EXPO_PUBLIC_DEV_LOGIN_PASSWORD` no `.env` e rode:

```powershell
npm run dev:account
```

O comando cria a conta com o e-mail já confirmado e o cargo **Desenvolvedor**. O botão "Entrar como desenvolvedor" só aparece
em modo de desenvolvimento.

## 6. Moderação pelo SQL

O dia a dia da moderação é feito no próprio app (Painel da equipe; veja [CARGOS.md](CARGOS.md)). Pelo SQL:

Execute no **SQL Editor** do Neon (como dona do banco):

```sql
-- Tornar uma usuária administradora (também dá para fazer pelo app; veja CARGOS.md)
insert into public.user_roles (user_id, role)
select id, 'administrator' from public.users where email = 'email@exemplo.com'
on conflict (user_id) do update set role = excluded.role;

-- Denúncias abertas
select r.created_at, r.reason, r.details, p.business_name, p.id as profile_id
from public.profile_reports r
join public.entrepreneur_profiles p on p.id = r.profile_id
where r.status = 'open'
order by r.created_at;

-- Suspender um perfil (a empreendedora vê o motivo e não consegue reativar)
select public.moderate_profile('ID-DO-PERFIL', 'suspended', 'Motivo exibido para a empreendedora');

-- Reativar (volta como "fora do Mural"; a empreendedora decide republicar)
select public.moderate_profile('ID-DO-PERFIL', 'unpublished');

-- Marcar denúncia como resolvida
update public.profile_reports set status = 'resolved', resolved_at = now(), resolution_note = 'Perfil suspenso'
where id = 'ID-DA-DENUNCIA';

-- Histórico de alterações de um perfil
select * from public.profile_audit_log where profile_id = 'ID-DO-PERFIL' order by created_at desc;
```
