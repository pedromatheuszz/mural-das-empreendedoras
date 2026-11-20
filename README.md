# Mural das Empreendedoras

Aplicativo Android e iOS (base única em React Native + Expo) para conectar, divulgar e dar visibilidade a mulheres
empreendedoras. Cada empreendedora cria um perfil profissional para a sua marca, publica no Mural e passa a ser
encontrada por clientes, parceiros e outras empreendedoras.

> **Status:** MVP completo (fases 1 a 8). Para funcionar de ponta a ponta, o app usa um projeto Neon
> (banco + Neon Auth + Data API) e o Cloudinary (imagens) — veja [docs/NEON.md](docs/NEON.md).

## Funcionalidades do MVP

- **Conta:** cadastro (nome, e-mail, senha e confirmação), aceite dos Termos/Política, declaração de 18+, login,
  confirmação de e-mail por código ou link, recuperação de senha por código ou link, troca de senha e de e-mail,
  sair (neste aparelho ou em todos) e **exclusão da conta pelo próprio app**.
- **Perfil empresarial:** cadastro guiado em 4 etapas + **prévia** antes de publicar, com consentimento explícito
  para divulgação pública; logotipo e foto (reduzidos e comprimidos antes do envio); categoria, cidade/UF,
  "atendo todo o Brasil", Instagram/rede social, WhatsApp/link de contato, site e **cortesias para outras
  empreendedoras** (inspirado no mural original).
- **Publicação:** publicar, retirar temporariamente do Mural, republicar, editar e excluir o perfil.
- **Mural:** saudação, busca, filtro por categoria, carrossel "Recém-chegadas" e lista paginada (rolagem infinita),
  com estados de carregamento, vazio e erro de conexão.
- **Busca:** por marca, nome da empreendedora, serviços e descrição — **sem diferenciar acentos** — com filtro por
  categoria e explorar por categoria.
- **Perfil público:** capa com foto/logotipo, contatos (WhatsApp com mensagem pronta, rede social, site),
  cortesias, aviso de responsabilidade e **denúncia de perfil**.
- **Meu Perfil e Configurações:** dados pessoais, status de publicação com chave "Visível no Mural", imagens,
  segurança, privacidade, Termos e Política (LGPD).
- **Moderação (preparada):** papéis de moderação, suspensão que só a moderação desfaz, denúncias e registro de
  alterações — prontos para um futuro painel web.
- **Grupo Joinville Empreendedoras:** 85 integrantes cadastradas pela organização (serviços, categoria e Instagram),
  com selo do grupo nos perfis e link para [@joinvilleempreendedoras](https://www.instagram.com/joinvilleempreendedoras).
  Para carregar os dados, veja [docs/NEON.md](docs/NEON.md#2-banco-tabelas-regras-de-segurança-e-dados-do-grupo).

## Tecnologias

Expo SDK 58 · React Native 0.88 · TypeScript · Expo Router (rotas protegidas) · Neon (Postgres, Neon Auth,
Data API, RLS) · Cloudinary (imagens) · TanStack Query (cache, paginação, offline) · React Hook Form + Zod · Reanimated · EAS Build.

## Como rodar

Pré-requisitos: Node.js 20+ e um projeto Neon configurado conforme [docs/NEON.md](docs/NEON.md).

```powershell
npm install
```

```powershell
Copy-Item .env.example .env
```

Preencha o `.env` com os endereços públicos do Neon Auth e da Data API (e do Cloudinary), aplique o banco com
`npm run db:migrate -- --seed` e inicie:

```powershell
npx expo start
```

Escaneie o QR code com o app **Expo Go** (Android/iOS) ou pressione `w` para abrir no navegador.
Detalhes em [docs/TESTES.md](docs/TESTES.md).

## Verificações automáticas

```powershell
npm run check
```

Executa, em sequência: checagem de tipos (`typecheck`), ESLint (`lint`), testes do app com Jest (`test`) e testes do
banco (`test:db`), que aplicam as migrations reais em um PostgreSQL embutido (PGlite) e verificam as regras de
segurança (RLS), sem precisar de Docker.

## Estrutura

```
src/
  app/                 Rotas (Expo Router)
    (auth)/            Login, cadastro, confirmação de e-mail, recuperação de senha
    (tabs)/            Início (Mural), Buscar, Divulgar, Meu Perfil
    entrepreneur/      Perfil público
    profile/           Criar, editar e prévia do perfil empresarial
    settings/          Configurações, dados pessoais, senha, exclusão de conta
    legal/             Termos de Uso e Política de Privacidade
    report/            Denúncia de perfil
  components/          Componentes visuais (ui/, profiles/, hub/, auth/, feedback/, ...)
  constants/           Tema (cores, tipografia), categorias, estados, cortesias, textos legais
  hooks/               Hooks de dados (React Query) e utilitários
  lib/                 Clientes do Neon Auth e da Data API, armazenamento seguro, React Query, variáveis de ambiente
  providers/           Autenticação e onboarding
  schemas/             Validações (Zod)
  services/            Acesso a dados (auth, perfis, imagens, denúncias, conta)
  types/               Tipos do banco e do domínio
  utils/               Links/WhatsApp, sanitização, formatação, mensagens de erro
database/
  migrations/          Estrutura do banco, RLS, busca, moderação e exclusão de conta (Neon)
  seed/                Dados do grupo Joinville Empreendedoras (e fotos baixadas, fora do git)
  tests/               Testes do banco com PGlite (simula o Neon)
scripts/               Migrations, conta de desenvolvedor, fotos do grupo (Instagram → Cloudinary)
docs/                  Guias de configuração, testes, arquitetura e publicação
```

## Documentação

| Guia | Conteúdo |
| --- | --- |
| [docs/CARGOS.md](docs/CARGOS.md) | Cargos (Desenvolvedor, Administradora, Empreendedora) e o que cada um pode fazer |
| [docs/NEON.md](docs/NEON.md) | Variáveis, migrations, Neon Auth, Cloudinary, login de desenvolvedor, moderação |
| [docs/TESTES.md](docs/TESTES.md) | Rodar no Android, iOS e web; testes automatizados; roteiro de testes manuais |
| [docs/ATUALIZACOES.md](docs/ATUALIZACOES.md) | Atualização do app pela API: `npm run release` e aviso obrigatório/opcional nos aparelhos |
| [docs/PUBLICACAO.md](docs/PUBLICACAO.md) | EAS Build/Submit, Google Play, App Store, privacidade e checklist de lançamento |
| [docs/ARQUITETURA.md](docs/ARQUITETURA.md) | Arquitetura, modelo de dados, segurança (RLS), moderação e evolução |
| [docs/FASES.md](docs/FASES.md) | Relatório por fase: arquivos, como testar e configurações externas |
