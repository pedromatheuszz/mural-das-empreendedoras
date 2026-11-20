/**
 * Publica uma nova versão do app: envia o APK para o GitHub Releases (download público)
 * e registra a versão pela API (Neon Data API). Os aparelhos com versão antiga passam a
 * ver o aviso de atualização assim que abrirem (ou voltarem para) o app.
 *
 * Uso:
 *   npm run release -- --versao 1.0.2 --notas "Novas cores e vínculo de perfil"
 *   npm run release -- --versao 1.0.3 --opcional            (atualização opcional)
 *   npm run release -- --versao 1.0.2 --url https://...     (APK já hospedado em outro lugar)
 *   npm run release -- --status                             (mostra a versão publicada)
 *
 * Padrões: APK em dist/mural-das-empreendedoras-<versao>.apk; plataforma android;
 * atualização OBRIGATÓRIA (a versão mínima vira a nova versão), a não ser com --opcional.
 * Precisa: GitHub CLI logado (gh auth login) e ROLE_ADMIN_* ou EXPO_PUBLIC_DEV_LOGIN_* no .env.
 */
import { Buffer } from 'node:buffer';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = process.env;
const appVersion = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8')).expo.version;

class ReleaseError extends Error {}
function fail(message) {
  throw new ReleaseError(message);
}

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
const flag = (name) => process.argv.includes(`--${name}`);
const run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

async function main() {
  const authUrl = env.EXPO_PUBLIC_NEON_AUTH_URL;
  const dataApiUrl = env.EXPO_PUBLIC_NEON_DATA_API_URL;
  if (!authUrl || !dataApiUrl) fail('defina EXPO_PUBLIC_NEON_AUTH_URL e EXPO_PUBLIC_NEON_DATA_API_URL no .env.');

  async function getDeveloperJwt() {
    const email = (env.ROLE_ADMIN_EMAIL || env.EXPO_PUBLIC_DEV_LOGIN_EMAIL || '').trim().toLowerCase();
    const password = env.ROLE_ADMIN_PASSWORD || env.EXPO_PUBLIC_DEV_LOGIN_PASSWORD;
    if (!email || !password) fail('defina ROLE_ADMIN_EMAIL e ROLE_ADMIN_PASSWORD (conta de desenvolvedor) no .env.');
    const origin = new URL(authUrl).origin;
    const signIn = await fetch(`${authUrl}/sign-in/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin },
      body: JSON.stringify({ email, password }),
    });
    if (!signIn.ok) fail(`não foi possível entrar com ${email} (${signIn.status}).`);
    const cookie = (signIn.headers.get('set-cookie') ?? '').split(';')[0];
    const { token } = await (await fetch(`${authUrl}/token`, { headers: { cookie, origin } })).json();
    if (!token) fail('o Neon Auth não devolveu o token de acesso.');
    return token;
  }

  async function rpc(jwt, name, body) {
    // A conexão nova do Neon às vezes chega sem a sessão: tenta de novo nesses casos.
    for (let attempt = 1; ; attempt++) {
      const response = await fetch(`${dataApiUrl}/rpc/${name}`, {
        method: 'POST',
        headers: { ...(jwt ? { authorization: `Bearer ${jwt}` } : {}), 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);
      if (response.ok) return data;
      if (attempt < 4 && /sessão não identificada/i.test(data?.message ?? '')) continue;
      fail(data?.message ?? `HTTP ${response.status}`);
    }
  }

  async function anonymousJwt() {
    const response = await fetch(`${authUrl}/token/anonymous`, { headers: { origin: new URL(authUrl).origin } });
    return (await response.json()).token;
  }

  const platform = arg('plataforma') ?? 'android';
  if (!['android', 'ios'].includes(platform)) fail('plataforma deve ser android ou ios.');

  if (flag('status')) {
    const [latest] = await rpc(await anonymousJwt(), 'latest_app_release', { target_platform: platform });
    if (!latest) console.log(`Nenhuma versão publicada para ${platform}.`);
    else {
      console.log(`Última versão (${platform}): ${latest.version}`);
      console.log(
        `Mínima exigida: ${latest.min_supported_version} ${latest.min_supported_version === latest.version ? '(obrigatória)' : ''}`,
      );
      console.log(`Download: ${latest.download_url}`);
      if (latest.release_notes) console.log(`Notas: ${latest.release_notes}`);
    }
    return;
  }

  const version = arg('versao') ?? appVersion;
  if (!/^\d{1,4}\.\d{1,4}\.\d{1,4}$/.test(version)) fail(`versão inválida: ${version} (use o formato 1.0.2).`);
  if (version !== appVersion) {
    console.warn(`Atenção: o app.json está na versão ${appVersion}, mas você está publicando ${version}.`);
  }
  const notes = arg('notas') ?? null;
  let url = arg('url');

  // Versão mínima: obrigatória por padrão; --opcional mantém a mínima anterior.
  const [current] = await rpc(await anonymousJwt(), 'latest_app_release', { target_platform: platform });
  const minVersion = arg('minima') ?? (flag('opcional') ? (current?.min_supported_version ?? '0.0.0') : version);

  if (!url) {
    if (platform !== 'android') fail('para iOS, informe --url (TestFlight ou App Store).');
    const apk = arg('apk') ?? join(root, 'dist', `mural-das-empreendedoras-${version}.apk`);
    if (!existsSync(apk)) fail(`APK não encontrado: ${apk}`);
    if (/teste/i.test(basename(apk)))
      fail('esse é o APK de TESTE (tem a senha de desenvolvedor). Publique o APK normal.');

    // Segurança: o APK não pode conter o login de desenvolvedor.
    const devEmail = (env.EXPO_PUBLIC_DEV_LOGIN_EMAIL || '').trim().toLowerCase();
    if (devEmail) {
      try {
        // O tar do Windows 10+ lê arquivos zip (o APK é um zip).
        const windowsTar = join(env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe');
        const bundle = execFileSync(
          existsSync(windowsTar) ? windowsTar : 'tar',
          ['-xOf', apk, 'assets/index.android.bundle'],
          {
            maxBuffer: 200 * 1024 * 1024,
            stdio: ['ignore', 'pipe', 'ignore'],
          },
        );
        if (bundle.includes(Buffer.from(devEmail)))
          fail('o APK contém o login de desenvolvedor. Gere o APK normal antes de publicar.');
      } catch (error) {
        if (error instanceof ReleaseError) throw error;
        console.warn('Aviso: não consegui ler o APK para conferir o login de desenvolvedor.');
      }
    }

    // Confere a versão gravada no APK (se o aapt do Android SDK estiver disponível).
    const aapt = join(env.LOCALAPPDATA ?? '', 'Android', 'Sdk', 'build-tools');
    try {
      const latestTools = existsSync(aapt) ? readdirSync(aapt).sort().at(-1) : undefined;
      if (latestTools) {
        const badging = run(join(aapt, latestTools, 'aapt.exe'), ['dump', 'badging', apk]);
        const versionName = badging.match(/versionName='([^']+)'/)?.[1];
        if (versionName && versionName !== version) fail(`o APK é da versão ${versionName}, não ${version}.`);
      }
    } catch (error) {
      if (error instanceof ReleaseError) throw error; // aapt ausente: pula a checagem
    }

    // Envia para o GitHub Releases do repositório (download público).
    try {
      run('gh', ['auth', 'status']);
    } catch {
      fail('o GitHub CLI não está logado. Rode "gh auth login" uma vez e tente de novo.');
    }
    const remote = run('git', ['remote', 'get-url', 'origin']);
    const repo = remote.match(/github\.com[/:]([^/]+\/[^/.]+)/)?.[1];
    if (!repo) fail(`não reconheci o repositório do GitHub em "${remote}".`);
    const tag = `v${version}`;
    console.log(`Enviando ${basename(apk)} (${(statSync(apk).size / 1048576).toFixed(1)} MB) para ${repo} (${tag})...`);
    run('gh', [
      'release',
      'create',
      tag,
      apk,
      '--repo',
      repo,
      '--title',
      `Mural das Empreendedoras ${version}`,
      '--notes',
      notes ?? `Versão ${version} do app.`,
    ]);
    url = `https://github.com/${repo}/releases/download/${tag}/${basename(apk)}`;
  }

  // O link precisa funcionar antes de avisar os aparelhos.
  const head = await fetch(url, { method: 'HEAD', redirect: 'follow' });
  if (!head.ok) fail(`o link de download não respondeu (${head.status}): ${url}`);

  const jwt = await getDeveloperJwt();
  const published = await rpc(jwt, 'publish_app_release', {
    target_platform: platform,
    new_version: version,
    url,
    notes,
    min_version: minVersion,
  });
  console.log(`\nPublicado: ${platform} ${published.version}`);
  console.log(
    published.min_supported_version === published.version
      ? 'Atualização OBRIGATÓRIA para versões anteriores.'
      : `Opcional (mínima exigida: ${published.min_supported_version}).`,
  );
  console.log(`Download: ${published.download_url}`);
}

// Sem process.exit: no Windows ele derruba o Node com conexões HTTP ainda abertas.
try {
  await main();
} catch (error) {
  console.error(`\nErro: ${error instanceof ReleaseError ? error.message : (error?.stack ?? error)}`);
  process.exitCode = 1;
}
