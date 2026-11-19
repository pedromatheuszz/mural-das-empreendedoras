# Arquitetura

## Camadas

```
Telas (src/app) ─► Componentes (src/components)
      │
      ▼
Hooks de dados (src/hooks · TanStack Query: cache, paginação, offline)
      │
      ▼
Serviços (src/services · única camada que fala com o Neon e o Cloudinary)
      │
      ▼
Clientes (src/lib/neon-auth.ts · sessão no Keychain/Keystore · src/lib/data-api.ts · JWT por requisição)
      │
      ▼
Neon Auth · Data API (PostgREST) ─► Postgres no Neon (RLS, gatilhos, funções) · Cloudinary (imagens)
```

- **Validação** em `src/schemas` (Zod), usada pelos formulários (React Hook Form) e repetida no banco (checks e
  gatilhos) — o banco nunca confia no app.
- **Regras de negócio sensíveis ficam no banco:** quem pode ler/editar, consentimento obrigatório para publicar,
  suspensão que só a moderação desfaz, datas oficiais de publicação e consentimento.
- **Navegação** (`src/app/_layout.tsx`): `Stack.Protected` separa rotas de visitante (onboarding, login, cadastro) das
  rotas autenticadas (abas, perfis, configurações). Redefinição de senha e textos legais ficam sempre acessíveis.

## Modelo de dados

| Tabela | Para quê | Leitura | Escrita |
| --- | --- | --- | --- |
| `users` | Nome e e-mail da conta (privados), aceite dos termos | Só a própria usuária | Só o próprio nome (e-mail é sincronizado pelo Auth) |
| `entrepreneur_profiles` | Perfil empresarial | Todos veem os **publicados**; a dona vê o seu em qualquer status | Só a dona (e a moderação) |
| `profile_reports` | Denúncias | Quem denunciou vê as próprias; moderação vê todas | Usuárias autenticadas, só de perfis publicados de outras pessoas |
| `user_roles` | Papéis `admin`/`moderator` | Só o próprio papel | Apenas via SQL/painel administrativo |
| `profile_audit_log` | Histórico de alterações (metadados, sem conteúdo) | Só moderação | Apenas pelos gatilhos do banco |

Perfis com `user_id` nulo são **cadastrados pela organização** (ex.: integrantes do grupo Joinville Empreendedoras):
aparecem no Mural com o selo do grupo, podem ser denunciados e só a moderação (ou o SQL Editor) os cria e altera.

`entrepreneur_profiles.publication_status`: `draft` (rascunho) · `published` (no Mural) · `unpublished` (retirado
pela empreendedora) · `suspended` (suspenso pela moderação).

Colunas além das pedidas no escopo: `serves_nationwide` e `community_perks` (vindas do mural original),
`public_consent_at`, `published_at`, `suspended_at`, `suspension_reason`, e as colunas geradas `sort_name` /
`search_text` (ordenação e busca sem acentos).

**Índices:** trigramas (GIN) para marca, empreendedora e texto de busca; parciais para a listagem publicada, recentes
e categoria; único por `user_id` (um perfil por conta no MVP).

## Segurança e privacidade

- **RLS em todas as tabelas** e políticas por operação; usuárias anônimas só leem perfis publicados.
- **Gatilhos de proteção:** impedem suspender/reativar sem ser moderação, transferir perfil, forjar datas de
  publicação ou de consentimento; sanitizam espaços e normalizam campos.
- **Consentimento LGPD:** `check (publication_status <> 'published' or public_consent_at is not null)`.
- **Privilégios mínimos:** `anon` não escreve em nada; a usuária só altera `full_name` em `users`; funções internas
  no schema `private` (fora da API); funções expostas com `search_path` fixo.
- **Storage:** cada usuária só envia/altera/apaga arquivos na pasta com o próprio id; imagens reduzidas no aparelho
  (máx. 800 px) e limite de 5 MB e tipos de imagem no bucket.
- **Sessão:** guardada no Keychain (iOS) / Keystore (Android) via `expo-secure-store`, dividida em partes para
  valores grandes; tokens renovados apenas com o app em primeiro plano.
- **Chaves:** o app recusa iniciar com chave secreta (`service_role` / `sb_secret_`).
- **Entradas:** remoção de caracteres invisíveis/controle, limites de tamanho, URLs só `http(s)` (no app e no banco),
  curingas de busca escapados.
- **Exclusão de conta:** apaga imagens, conta, perfil e papéis; denúncias feitas ficam anonimizadas.

## Experiência e desempenho

- Paginação de 12 itens com rolagem infinita; colunas selecionadas por tela (cards não trafegam campos do perfil
  completo).
- Cache do React Query com nova tentativa só para falhas de rede/5xx; consultas pausadas offline e atualizadas ao
  voltar ao app; aviso de "sem internet".
- Imagens com `expo-image` (cache em memória e disco, transição suave).
- Fontes carregadas por peso (apenas os pesos usados entram no app).
- Acessibilidade: rótulos, papéis e estados em elementos interativos, avisos de erro anunciados, suporte a fonte
  ampliada e contraste AA nas combinações de texto da paleta.

## Evolução prevista (fora do MVP, não implementado)

- **Vários negócios por conta:** remover o índice `entrepreneur_profiles_one_per_user_idx` e transformar a aba
  Divulgar em uma lista de negócios — o restante do app já trabalha com o `id` do perfil.
- **Painel administrativo web:** usar `is_moderator()`, `moderate_profile()`, `profile_reports` e
  `profile_audit_log`, que já existem.
- Favoritos, avaliações, mensagens, eventos, oportunidades e planos: novas tabelas com RLS no mesmo padrão.
