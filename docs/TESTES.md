# Testes

## Testes automatizados

```powershell
npm run check
```

| Comando | O que verifica |
| --- | --- |
| `npm run typecheck` | Tipos TypeScript de todo o projeto |
| `npm run lint` | ESLint (regras do Expo e do React Compiler) |
| `npm test` | Jest: validações (Zod), links/WhatsApp, sanitização, mensagens de erro, armazenamento seguro, serviços de dados, componentes e telas (login e Mural) |
| `npm run test:db` | Aplica as migrations reais em um PostgreSQL embutido (PGlite) e testa RLS, consentimento, suspensão, busca sem acentos, denúncias, auditoria, storage e exclusão de conta |

Os testes de banco simulam as roles da Data API do Neon (`anonymous`/`authenticated`) e o usuário do token, exatamente como a API
faz. Não precisam de Docker nem de conexão com o seu projeto.

## Rodando o app

Antes, configure o `.env` (veja [NEON.md](NEON.md)) e instale as dependências com `npm install`.

### No celular com o Expo Go (mais rápido)

1. Instale o **Expo Go** (Play Store / App Store).
2. Deixe o computador e o celular na mesma rede Wi-Fi e rode:

```powershell
npx expo start
```

3. **Android:** abra o Expo Go e escaneie o QR code. **iPhone:** escaneie com a câmera.
4. Se a rede bloquear a conexão (Wi-Fi corporativo, por exemplo), use o túnel:

```powershell
npx expo start --tunnel
```

> Confirmação de e-mail e recuperação de senha usam o **código de 6 dígitos** enviado por e-mail, que funciona
> em qualquer aparelho, inclusive no Expo Go.

### Emulador Android

Instale o Android Studio, crie um dispositivo virtual (AVD), inicie-o e pressione `a` no terminal do `npx expo start`.

### Simulador iOS

Requer um Mac com Xcode: pressione `i` no terminal do `npx expo start`. No Windows, teste em um iPhone físico com o
Expo Go ou gere um build pelo EAS.

### Build de desenvolvimento (mais próximo do app final)

Recomendado antes de publicar (ícone, splash, nome e links `hubempreendedoras://` reais):

```powershell
npx eas-cli@latest build --profile development --platform android
```

Instale o APK gerado no celular e rode `npx expo start --dev-client`. Para iOS, use `--platform ios` (exige conta
Apple Developer para instalar no aparelho).

### No navegador (apenas para conferências rápidas)

```powershell
npx expo start --web
```

O produto é focado em Android e iOS; a versão web serve para revisar telas durante o desenvolvimento.

## Roteiro de testes manuais (com Neon configurado)

Use duas contas (A e B) para validar as regras entre usuárias.

1. **Onboarding:** os 3 slides aparecem só na primeira abertura; "Pular" leva ao login.
2. **Cadastro (A):** campos inválidos mostram mensagens em português; sem aceitar os Termos ou sem declarar 18+ o
   cadastro não avança. Com confirmação de e-mail ligada, digite o código recebido.
3. **Login/Logout:** senha errada mostra "E-mail ou senha incorretos."; feche e reabra o app — a sessão continua.
4. **Recuperar senha:** "Esqueci minha senha" → código por e-mail → nova senha → entra no Mural.
5. **Criar perfil (A):** percorra as 4 etapas, adicione logotipo e foto, informe WhatsApp `(11) 91234-5678` e
   `@suamarca`. Na prévia, tente publicar sem marcar o consentimento (deve bloquear), marque e publique.
6. **Mural (B):** o perfil de A aparece em "Recém-chegadas" e na lista; filtre pela categoria; role até o fim.
7. **Busca (B):** procure pelo nome da marca **sem acento** (ex.: "atelie"), pelo nome da empreendedora e por uma
   palavra da descrição; uma busca sem resultados mostra a mensagem amigável.
8. **Perfil público (B):** "Chamar no WhatsApp" abre o WhatsApp com mensagem pronta; denuncie o perfil e tente
   denunciar de novo (deve avisar que já denunciou).
9. **Retirar do Mural (A):** o perfil some para B; republique e ele volta.
10. **Editar (A):** altere a descrição e a foto; saia sem salvar e confirme o aviso de alterações não salvas.
11. **Sem internet:** ative o modo avião — aparece o aviso "Você está sem internet", as telas mostram os dados em
    cache ou "Sem conexão" com "Tentar novamente".
12. **Suspensão:** pelo SQL Editor, suspenda o perfil de A (veja [NEON.md](NEON.md)); A vê "Suspenso" com o
    motivo e não consegue reativar.
13. **Exclusões:** exclua o perfil empresarial de A (a conta continua) e, depois, a conta de B digitando EXCLUIR.
14. **Acessibilidade:** com TalkBack (Android) ou VoiceOver (iOS) ativos, navegue pelas abas, cards e formulários;
    aumente a fonte do sistema e confira que os textos acompanham.
