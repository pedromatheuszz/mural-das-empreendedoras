/**
 * Baixa UMA vez a foto pública de perfil do Instagram de cada integrante do grupo
 * (a partir do arquivo de dados database/seed/joinville-empreendedoras.sql) e salva em
 * database/seed/images/<usuario>.jpg, já reduzida e comprimida.
 *
 * Uso: node scripts/fetch-instagram-photos.mjs   (pula as que já foram baixadas)
 * Observação: o link da foto no Instagram expira; por isso a imagem é guardada e depois
 * enviada ao Cloudinary (scripts/upload-seed-images.mjs).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const seed = readFileSync(join(root, 'database/seed/joinville-empreendedoras.sql'), 'utf8');
const outDir = join(root, 'database/seed/images');
mkdirSync(outDir, { recursive: true });

const handles = [...seed.matchAll(/'([a-z0-9._]{1,30})'(?:::text)?\)/g)].map((match) => match[1]);
const UA = 'Mozilla/5.0';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const results = { ok: [], skipped: [], failed: [] };
for (const handle of handles) {
  const file = join(outDir, `${handle}.jpg`);
  if (existsSync(file)) {
    results.skipped.push(handle);
    continue;
  }
  try {
    const page = await fetch(`https://www.instagram.com/${handle}/`, { headers: { 'User-Agent': UA } });
    if (!page.ok) throw new Error(`página ${page.status}`);
    const html = await page.text();
    const match = html.match(/<meta property="og:image" content="([^"]+)"/);
    if (!match) throw new Error('sem og:image (perfil inexistente, privado ou bloqueio)');
    const imageUrl = match[1].replace(/&amp;/g, '&');
    const image = await fetch(imageUrl, { headers: { 'User-Agent': UA } });
    if (!image.ok) throw new Error(`imagem ${image.status}`);
    const buffer = Buffer.from(await image.arrayBuffer());
    const jpeg = await sharp(buffer).resize(640, 640, { fit: 'cover', withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();
    writeFileSync(file, jpeg);
    results.ok.push(handle);
    console.log(`ok  ${handle}`);
  } catch (error) {
    results.failed.push(`${handle}: ${error.message}`);
    console.log(`ERR ${handle}: ${error.message}`);
  }
  await sleep(2500 + Math.random() * 1500);
}

writeFileSync(join(outDir, '_resultado.json'), JSON.stringify(results, null, 2));
console.log(`\nBaixadas: ${results.ok.length} · já existiam: ${results.skipped.length} · falharam: ${results.failed.length}`);
