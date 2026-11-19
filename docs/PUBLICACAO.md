# Compilação e publicação nas lojas

Os builds são feitos na nuvem pelo **EAS** (Expo Application Services): não é preciso Android Studio nem Mac.

## 1. Antes do primeiro build de produção

- [ ] **Identificadores do app:** em `app.json`, troque `ios.bundleIdentifier` e `android.package`
      (`br.com.hubempreendedoras.app`) por um identificador do domínio da sua organização. **Não dá para mudar depois
      de publicar.**
- [ ] **Dados legais:** preencha `LEGAL_ENTITY` em `src/constants/app.ts` (razão social, CNPJ, cidade) e os e-mails
      `EXPO_PUBLIC_SUPPORT_EMAIL` e `EXPO_PUBLIC_PRIVACY_EMAIL`.
- [ ] **Termos e Política:** revise `src/constants/legal.ts` com assessoria jurídica e publique os mesmos textos em uma
      página web (as lojas exigem um link público para a Política de Privacidade).
- [ ] **Neon em produção:** confirmação de e-mail ligada (já está), SMTP próprio no Neon Auth e upload preset
      do Cloudinary restrito (veja [NEON.md](NEON.md)).
- [ ] **Exclusão de conta pela web:** o Google Play exige também um link (fora do app) onde a pessoa possa pedir a
      exclusão. Pode ser uma página simples com o e-mail de privacidade e o passo a passo do app
      (Meu Perfil → Excluir minha conta).
- [ ] **Versão:** a cada lançamento, aumente `version` em `app.json` (ex.: `1.0.1`). O número de build é incrementado
      automaticamente pelo EAS (`appVersionSource: remote`).

## 2. Configurar o EAS (uma vez)

```powershell
npx eas-cli@latest login
```

```powershell
npx eas-cli@latest init
```

O `init` cria o projeto na sua conta Expo e grava o `projectId` no `app.json`.

Cadastre as variáveis de ambiente (o `.env` não vai para o EAS). Repita para `preview` e `development`:

```powershell
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_NEON_AUTH_URL --value https://SEU-ENDPOINT.neonauth.REGIAO.aws.neon.tech/neondb/auth --visibility plaintext
```

```powershell
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_NEON_DATA_API_URL --value https://SEU-ENDPOINT.apirest.REGIAO.aws.neon.tech/neondb/rest/v1 --visibility plaintext
```

As variáveis `EXPO_PUBLIC_*` ficam embutidas no app; por isso só endereços **públicos** podem ir ali. Cadastre também `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` e
`EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.

## 3. Builds

| Perfil | Para quê | Comando |
| --- | --- | --- |
| `development` | Desenvolvimento com o app instalado (dev client) | `npx eas-cli@latest build --profile development --platform android` |
| `preview` | APK/IPA para testadoras (distribuição interna) | `npx eas-cli@latest build --profile preview --platform android` |
| `production` | Lojas (AAB para o Google Play, IPA para a App Store) | `npx eas-cli@latest build --profile production --platform all` |

## 4. Google Play

1. Crie uma conta no [Google Play Console](https://play.google.com/console) (taxa única de US$ 25).
2. Crie o app, preencha a ficha da loja (descrição, capturas de tela, ícone 512×512 — use `assets/images/icon.png`).
3. **Segurança dos dados (Data safety):** declare a coleta de nome e e-mail (conta), fotos e outros conteúdos
   enviados pela usuária (perfil público) e dados de uso técnico; criptografia em trânsito; exclusão de conta
   disponível no app e pelo link web.
4. Envie o primeiro AAB manualmente pelo Play Console (exigência do Google para apps novos) ou configure uma conta de
   serviço e use `npx eas-cli@latest submit --platform android`.
5. Comece por um teste interno/fechado e depois promova para produção.

## 5. App Store (iOS)

1. Inscreva-se no [Apple Developer Program](https://developer.apple.com/programs/) (US$ 99/ano).
2. Crie o app no App Store Connect com o mesmo `bundleIdentifier`.
3. Envie o build:

```powershell
npx eas-cli@latest submit --platform ios
```

4. **App Privacy:** informe nome e e-mail (funcionalidade do app), fotos e conteúdo da usuária (funcionalidade do
   app); nenhum dado usado para rastreamento.
5. **Conteúdo gerado por usuárias (diretriz 1.2):** o app já tem Termos de Uso, denúncia de perfis e moderação com
   suspensão. Informe na revisão um e-mail de contato e o compromisso de analisar denúncias em até 24 horas. A Apple
   também pode pedir uma forma de **bloquear** usuárias abusivas — se solicitado, este é o primeiro item a acrescentar.
6. **Exclusão de conta (diretriz 5.1.1):** disponível em Meu Perfil → Excluir minha conta.
7. Crie uma conta de demonstração com um perfil publicado para a equipe de revisão e informe-a no App Store Connect.

## 6. Depois do lançamento

- Acompanhe as denúncias diariamente (consultas em [NEON.md](NEON.md#6-moderação-até-existir-o-painel-web)).
- Para correções só de JavaScript, considere o **EAS Update** (atualizações sem nova revisão das lojas).
