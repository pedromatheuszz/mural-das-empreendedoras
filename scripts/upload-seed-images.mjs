/**
 * Envia ao Cloudinary as fotos do grupo baixadas em database/seed/images/<usuario>.jpg
 * (scripts/fetch-instagram-photos.mjs) e grava o endereço em logo_url de cada perfil curado.
 *
 * Uso: npm run photos:upload
 * Lê do .env: CLOUDINARY_URL (cloudinary://API_KEY:API_SECRET@CLOUD_NAME — segredo, só aqui)
 * e NEON_DATABASE_URL. Pode rodar de novo: as imagens são sobrescritas (mesmo public_id).
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import pg from 'pg';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cloudinary = process.env.CLOUDINARY_URL?.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
if (!cloudinary || !process.env.NEON_DATABASE_URL) {
  console.error('Defina CLOUDINARY_URL e NEON_DATABASE_URL no .env.');
  process.exit(1);
}
const [, apiKey, apiSecret, cloudName] = cloudinary;

async function upload(file, publicId) {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder: 'mural/curated', overwrite: 'true', public_id: publicId, timestamp };
  const toSign = Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join('&');
  const form = new FormData();
  for (const [key, value] of Object.entries(params)) form.append(key, String(value));
  form.append('api_key', apiKey);
  form.append('signature', createHash('sha1').update(toSign + apiSecret).digest('hex'));
  form.append('file', new Blob([readFileSync(file)], { type: 'image/jpeg' }), `${publicId}.jpg`);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: form });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
  return data.secure_url;
}

const client = new pg.Client({ connectionString: process.env.NEON_DATABASE_URL.replace('sslmode=require', 'sslmode=verify-full') });
await client.connect();
const dir = join(root, 'database/seed/images');
let ok = 0;
try {
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.jpg'))) {
    const handle = file.replace(/\.jpg$/, '');
    try {
      const url = await upload(join(dir, file), handle.replace(/\./g, '_'));
      const result = await client.query(
        `update public.entrepreneur_profiles set logo_url = $1 where user_id is null and instagram_url = $2`,
        [url, `https://www.instagram.com/${handle}`],
      );
      ok += result.rowCount;
      console.log(`ok  ${handle}`);
    } catch (error) {
      console.log(`ERR ${handle}: ${error.message}`);
    }
  }
} finally {
  await client.end();
}
console.log(`\nPerfis atualizados: ${ok}`);
