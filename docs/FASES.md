# Relatório por fase

Resultados de verificação registrados em 18/11/2026, nesta máquina (Windows, Node 24).

## Fase 1 — Projeto, estrutura e identidade visual

**Arquivos:** `package.json`, `app.json`, `eslint.config.js`, `.gitignore`, `.env.example`,
`src/constants/{theme,categories,locations,perks,app}.ts`, `assets/images/*` (ícone, ícone adaptativo e monocromático,
splash, símbolo, favicon), `src/components/ui/*`, `src/components/feedback/*`, `src/components/brand-splash.tsx`,
`src/components/config-error-screen.tsx`, `src/components/navigation/tab-bar.tsx`,
`src/components/onboarding/onboarding-art.tsx`, `src/app/{_layout,index,onboarding}.tsx`,
`src/lib/{env,query-client}.ts`.

**Identidade:** vinho/bordô `#6B1D3A` (identidade e botões), rosa queimado `#C2706F` (destaques), off-white
`#FBF8F5` (fundo), bege `#F4ECE4` (áreas secundárias), grafite `#232126` (textos); títulos em Fraunces, textos em
Plus Jakarta Sans; símbolo de flor de 5 pétalas (o "hub" no centro e as empreendedoras ao redor).

**Como testar:** `npx expo start` → onboarding com 3 slides.
**Configuração externa:** nenhuma.

## Fase 2 — Cadastro, login e autenticação

**Arquivos:** `src/lib/{supabase,secure-storage}.ts`, `src/providers/{auth,onboarding}-provider.tsx`,
`src/services/{auth,account}.service.ts`, `src/schemas/auth.schema.ts`, `src/app/(auth)/*`,
`src/app/reset-password.tsx`, `src/components/auth/*`, `supabase/templates/*.html`.

**Como testar:** cadastro → código de confirmação → Mural; login/logout; "Esqueci minha senha".
**Configuração externa:** Supabase Auth (confirmação de e-mail, regras de senha, Redirect URLs, templates e SMTP) —
[SUPABASE.md](SUPABASE.md#4-autenticação).

## Fase 3 — Banco de dados no Supabase

**Arquivos:** `supabase/migrations/*.sql` (6 migrations), `supabase/config.toml`, `supabase/tests/*`,
`src/types/{database,models}.ts`.

**Verificação:** `npm run test:db` → **20 de 20 testes passaram** (RLS, consentimento, suspensão, busca sem acentos,
denúncias, auditoria, storage, exclusão de conta) sobre PostgreSQL embutido (PGlite).
**Configuração externa:** aplicar as migrations no seu projeto — [SUPABASE.md](SUPABASE.md#2-criar-as-tabelas-regras-de-segurança-e-o-bucket-de-imagens).

## Fase 4 — Cadastro e edição do perfil empresarial

**Arquivos:** `src/schemas/profile.schema.ts`, `src/services/{profiles,storage}.service.ts`,
`src/hooks/{use-profiles,use-account,use-confirm-discard}.ts`, `src/components/profiles/*`,
`src/app/profile/{create,edit,preview}.tsx`, `src/app/(tabs)/publish.tsx`, `src/utils/{url,sanitize}.ts`.

**Como testar:** aba Divulgar → 4 etapas → prévia → consentimento → publicar; editar, retirar do Mural, republicar,
excluir.

## Fase 5 — Mural e listagem

**Arquivos:** `src/app/(tabs)/{_layout,hub,me}.tsx`, `src/components/hub/hub-sections.tsx`,
`src/components/profiles/{profile-card,featured-profile-card,category-filter}.tsx`.

**Como testar:** aba Início → "Recém-chegadas", filtro por categoria, lista com rolagem infinita, puxar para atualizar.

## Fase 6 — Pesquisa e perfil completo

**Arquivos:** `src/app/(tabs)/search.tsx`, `src/app/entrepreneur/[id].tsx`, `src/app/report/[id].tsx`,
`src/hooks/use-debounced-value.ts`, `src/services/reports.service.ts`, `src/schemas/report.schema.ts`.

**Como testar:** aba Buscar → termo sem acento, categoria, busca sem resultados; abrir perfil → contatos → denunciar.

## Fase 7 — Segurança, privacidade, testes e correções

**Arquivos:** `src/constants/legal.ts`, `src/components/legal/*`, `src/app/legal/*`, `src/app/settings/*`,
`src/utils/{errors,format}.ts`, testes em `src/**/__tests__/`, `src/testing/providers.tsx`, `jest.setup.ts`.

**Verificações:**
- `npm run typecheck` e `npm run lint` sem erros.
- `npm test` → **60 de 60 testes passaram** (9 suítes).
- Revisão visual no navegador (tamanho de celular e tablet) contra uma API simulada local, só para conferência:
  onboarding, cadastro e validações, login, Mural, perfil público, denúncia, cadastro guiado com prévia e
  consentimento, publicar/retirar/excluir, Meu Perfil, Busca, Configurações e Exclusão de conta.

**Correções feitas nesta fase:** posição da ilustração do 3º slide; abrir o app direto em uma rota protegida
redirecionava para o Mural antes de restaurar a sessão; após publicar, um efeito levava para a edição em vez da aba
Divulgar; chips de categoria mais compactos; opção `lock` descontinuada no supabase-js 2.119; troca do
`react-native-keyboard-controller` (não funciona no Expo Go) pelo `KeyboardAvoidingView`.

## Fase 8 — Builds e documentação

**Arquivos:** `eas.json`, `app.json` (identificadores, permissões mínimas, splash e ícones), `README.md`, `docs/*`.

**Verificações:** `npx expo-doctor` → **20 de 20 checagens ok**; `npx expo export --platform android --platform ios` →
bundles Hermes gerados para Android e iOS sem erros.
**Configuração externa:** conta Expo/EAS, Google Play Console, Apple Developer — [PUBLICACAO.md](PUBLICACAO.md).

## Atualização — empreendedoras do grupo Joinville Empreendedoras

**Arquivos:** `supabase/migrations/20261118000700_curated_profiles.sql` (perfis sem conta, cadastrados pela
moderação/organização; denúncia corrigida para esses perfis), `supabase/seed/joinville-empreendedoras.sql`
(85 perfis), `src/components/profiles/community-banner.tsx`, `src/components/profiles/contact-actions.tsx` (Instagram
como botão principal quando não há WhatsApp), `src/app/entrepreneur/[id].tsx`, `src/app/(tabs)/{hub,me}.tsx`
(link do grupo), `src/constants/app.ts` (`COMMUNITY`), `src/types/database.ts`, `src/services/profiles.service.ts`.

**Verificações:** `npm run test:db` → **22 de 22** (inclui aplicar o seed duas vezes: 85 perfis publicados, nomes e
Instagram sem repetição, 82 links válidos, busca "empadao" sem acento); `npm test` → **62 de 62**; revisão visual do
Mural, da busca e do perfil público com os dados do grupo.

**Configuração externa:** rodar a migration 7 e o arquivo de dados no Supabase e revisar os itens marcados —
[SUPABASE.md](SUPABASE.md#21-empreendedoras-do-grupo-joinville-empreendedoras).

## O que ainda não foi verificado

Dependem de credenciais ou aparelhos que não estavam disponíveis durante o desenvolvimento:

- Fluxo completo contra um projeto Supabase real (envio de e-mails, upload de imagens, RLS no servidor real).
- Execução em aparelhos Android e iOS físicos ou emuladores (teclado, galeria de fotos, abertura do WhatsApp,
  links `hubempreendedoras://`).
- Builds do EAS e envio às lojas.

Siga [SUPABASE.md](SUPABASE.md) e o roteiro de [TESTES.md](TESTES.md) para validar esses pontos.

## Migração para Neon + Cloudinary

O Supabase foi substituído (os trechos acima que citam Supabase são o histórico das fases):

- **Banco:** Postgres no Neon. As migrations foram portadas para `database/migrations` (roles `anonymous`/`authenticated`
  e contas em `neon_auth."user"`) e são aplicadas com `npm run db:migrate`.
- **Login:** Neon Auth, por um cliente próprio para React Native (`src/lib/neon-auth.ts`). A confirmação de e-mail e a
  recuperação de senha funcionam por código.
- **Dados:** Data API do Neon via `@supabase/postgrest-js` (`src/lib/data-api.ts`). O app não usa mais o supabase-js.
- **Imagens:** Cloudinary, com upload preset não assinado (`src/services/storage.service.ts`).

Guia: [NEON.md](NEON.md).

## Pedidos da cliente — 19/11/2026

- **Vincular a conta ao perfil do grupo:** a empreendedora pede pelo app e a equipe aprova no Painel da equipe (ou
  vincula direto pelo e-mail). Veja [CARGOS.md](CARGOS.md#vínculo-de-perfis-do-grupo).
- **Cores do grupo:** paleta trocada de vinho/rosa para o roxo `#491174` / `#370661` e o lilás `#9B72C4` do grupo
  Joinville Empreendedoras. Ícone, splash e favicon foram redesenhados nas mesmas cores.
- **Botão "Início":** o contêiner invisível do botão central (Divulgar) ficava por cima da parte de cima dos botões
  laterais e "engolia" os toques. Corrigido (`pointerEvents="box-none"`). Além disso, tocar na aba já aberta volta ao
  topo da tela.
- **Sessão do Neon:** quando o Neon abre uma conexão nova sem carregar a sessão do JWT, as funções da equipe respondem
  "Sessão não identificada" e o app repete sozinho. As telas abertas direto (link) esperam a sessão salva ser restaurada
  antes de pedir dados.
