# Atualização do app pela API

Quando sai uma versão nova, o desenvolvedor publica pela API. A partir daí, todo aparelho com versão antiga vê o
aviso assim que abre o app ou volta para ele (a checagem também roda a cada 30 minutos com o app aberto).

| Tipo | O que a usuária vê |
| --- | --- |
| **Obrigatória** (padrão) | Tela cheia "Atualize o Mural das Empreendedoras" com o botão **Baixar atualização**. Não fecha, nem pelo botão voltar, até instalar a versão nova. |
| **Opcional** (`--opcional`) | Aviso "Nova versão disponível" com **Atualizar** / **Agora não**. "Agora não" não pergunta de novo para a mesma versão. |

## Como publicar uma versão (Android)

1. Suba a versão no `app.json`: `expo.version` (ex.: `1.0.2`) e `android.versionCode` (+1).
2. Gere o APK **normal**, sem o login de desenvolvedor, e salve como `dist/mural-das-empreendedoras-1.0.2.apk`.
3. Publique:

```bash
npm run release -- --versao 1.0.2 --notas "Novas cores e vínculo de perfil"
```

O script faz quatro coisas:

1. Confere o APK. Ele recusa o APK de teste, um APK que contenha o login de desenvolvedor e um APK de outra versão.
2. Envia o APK para o **GitHub Releases** do repositório (tag `v1.0.2`). O link de download é público.
3. Testa se o link de download responde.
4. Registra a versão na tabela `app_releases` pela função `publish_app_release`. Só a conta de **Desenvolvedor** pode chamar essa função.

Outras opções:

```bash
npm run release -- --status                                   # versão publicada hoje
npm run release -- --versao 1.0.3 --opcional                  # atualização opcional
npm run release -- --versao 1.0.3 --minima 1.0.2              # obriga só quem está abaixo da 1.0.2
npm run release -- --versao 1.0.2 --url https://.../app.apk   # APK hospedado em outro lugar
```

Requisitos (uma vez só):

- `gh auth login`: GitHub CLI logado numa conta com acesso ao repositório.
- `ROLE_ADMIN_EMAIL` / `ROLE_ADMIN_PASSWORD` (conta de desenvolvedor) no `.env`.

## Como funciona

- **Banco:** a tabela `public.app_releases` guarda plataforma, versão, versão mínima, link e notas. A leitura é pública e a escrita só acontece por `publish_app_release`, que exige o cargo de desenvolvedor e uma versão maior que a anterior. A migração é `database/migrations/20261119001400_app_releases.sql`.
- **App:** o `UpdateGate` (`src/components/updates/update-gate.tsx`) consulta `latest_app_release` e compara a versão publicada com a versão instalada, que é a do `app.json` no build.
  - Abaixo da versão mínima: a atualização é obrigatória.
  - Abaixo da última versão: a atualização é opcional.
  - Sem login, o app usa o token anônimo do Neon Auth.
- **Instalação:** o Android baixa o APK pelo navegador. Na primeira vez, pode pedir permissão para "instalar apps desta fonte". Como o APK é assinado com a mesma chave, a instalação substitui o app e mantém os dados.

> Os aparelhos com a **1.0.1 ou anterior** não têm essa checagem. Eles precisam instalar a 1.0.2 manualmente, uma
> única vez. Da 1.0.2 em diante, as atualizações passam a ser avisadas pelo app.

## Desfazer uma publicação errada

Apague o registro no Neon (SQL Editor). Os aparelhos voltam a considerar a versão anterior na próxima checagem:

```sql
delete from public.app_releases where platform = 'android' and version = '1.0.2';
```
