/**
 * Aplica no Neon as migrations de database/migrations que ainda não foram aplicadas
 * (controle na tabela private.schema_migrations) e, com --seed, os dados de database/seed.
 *
 * Uso:  npm run db:migrate            (só migrations)
 *       npm run db:migrate -- --seed  (migrations + dados do grupo; o seed é idempotente)
 * Lê NEON_DATABASE_URL do arquivo .env (conexão da dona do banco — nunca vai para o app).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import pg from 'pg';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const url = process.env.NEON_DATABASE_URL;
if (!url) {
  console.error('Defina NEON_DATABASE_URL no .env e rode com: node --env-file=.env scripts/db-migrate.mjs');
  process.exit(1);
}

const client = new pg.Client({ connectionString: url.replace('sslmode=require', 'sslmode=verify-full') });
await client.connect();

try {
  await client.query(`create schema if not exists private`);
  await client.query(
    `create table if not exists private.schema_migrations (name text primary key, applied_at timestamptz not null default now())`,
  );
  const applied = new Set((await client.query(`select name from private.schema_migrations`)).rows.map((row) => row.name));

  const dir = join(root, 'database/migrations');
  const pending = readdirSync(dir).filter((file) => file.endsWith('.sql') && !applied.has(file)).sort();
  for (const file of pending) {
    await client.query('begin');
    try {
      await client.query(readFileSync(join(dir, file), 'utf8'));
      await client.query(`insert into private.schema_migrations (name) values ($1)`, [file]);
      await client.query('commit');
      console.log(`aplicada  ${file}`);
    } catch (error) {
      await client.query('rollback');
      throw new Error(`Falha em ${file}: ${error.message}`);
    }
  }
  if (pending.length === 0) console.log('Nenhuma migration pendente.');

  if (process.argv.includes('--seed')) {
    await client.query(readFileSync(join(root, 'database/seed/joinville-empreendedoras.sql'), 'utf8'));
    console.log('seed      joinville-empreendedoras.sql');
  }

  // Pede para a Data API recarregar o cache de tabelas/funções.
  await client.query(`notify pgrst, 'reload schema'`);
} finally {
  await client.end();
}

// O NOTIFY nem sempre chega a todas as instâncias da Data API: atualiza também pela API do Neon.
const { NEON_API_KEY: apiKey, NEON_PROJECT_ID: projectId, NEON_BRANCH_ID: branchId } = process.env;
if (apiKey && projectId && branchId) {
  const database = new URL(url).pathname.replace(/^\//, '') || 'neondb';
  const response = await fetch(
    `https://console.neon.tech/api/v2/projects/${projectId}/branches/${branchId}/data-api/${database}`,
    { method: 'PATCH', headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' }, body: '{}' },
  );
  console.log(response.ok ? 'Cache da Data API atualizado.' : `Aviso: não foi possível atualizar o cache da Data API (${response.status}).`);
} else {
  console.log('Aviso: defina NEON_PROJECT_ID e NEON_BRANCH_ID no .env para atualizar o cache da Data API automaticamente.');
}
