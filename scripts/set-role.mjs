/**
 * Gerencia cargos PELA API do app (Neon Auth + Data API), com as mesmas regras do app:
 * entra com uma conta de desenvolvedor e chama as funções do banco que validam o cargo.
 *
 * Uso:
 *   npm run role -- <e-mail> <cargo>     cargo: desenvolvedor | administradora | empreendedora
 *   npm run role -- --list [busca]       lista contas e cargos
 *
 * Credenciais do desenvolvedor (no .env): ROLE_ADMIN_EMAIL / ROLE_ADMIN_PASSWORD
 * ou, se não existirem, EXPO_PUBLIC_DEV_LOGIN_EMAIL / EXPO_PUBLIC_DEV_LOGIN_PASSWORD.
 */
const ROLE_ALIASES = {
  desenvolvedor: 'developer',
  developer: 'developer',
  dev: 'developer',
  administradora: 'administrator',
  administrador: 'administrator',
  admin: 'administrator',
  administrator: 'administrator',
  empreendedora: 'entrepreneur',
  empreendedor: 'entrepreneur',
  entrepreneur: 'entrepreneur',
};
const ROLE_LABELS = { developer: 'Desenvolvedor', administrator: 'Administradora', entrepreneur: 'Empreendedora' };

const env = process.env;
const authUrl = env.EXPO_PUBLIC_NEON_AUTH_URL;
const dataApiUrl = env.EXPO_PUBLIC_NEON_DATA_API_URL;
const email = (env.ROLE_ADMIN_EMAIL || env.EXPO_PUBLIC_DEV_LOGIN_EMAIL || '').trim().toLowerCase();
const password = env.ROLE_ADMIN_PASSWORD || env.EXPO_PUBLIC_DEV_LOGIN_PASSWORD;

function fail(message) {
  console.error(`Erro: ${message}`);
  process.exit(1);
}

if (!authUrl || !dataApiUrl) fail('defina EXPO_PUBLIC_NEON_AUTH_URL e EXPO_PUBLIC_NEON_DATA_API_URL no .env.');
if (!email || !password) fail('defina ROLE_ADMIN_EMAIL e ROLE_ADMIN_PASSWORD (conta de desenvolvedor) no .env.');

/** Entra no Neon Auth e troca a sessão por um JWT da Data API. */
async function getJwt() {
  const origin = new URL(authUrl).origin;
  const signIn = await fetch(`${authUrl}/sign-in/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify({ email, password }),
  });
  if (!signIn.ok) fail(`não foi possível entrar com ${email} (${signIn.status}). Confira a senha.`);
  const cookie = (signIn.headers.get('set-cookie') ?? '').split(';')[0];
  const token = await fetch(`${authUrl}/token`, { headers: { cookie, origin } });
  const { token: jwt } = await token.json();
  if (!jwt) fail('o Neon Auth não devolveu o token de acesso.');
  return jwt;
}

async function rpc(jwt, name, body) {
  const response = await fetch(`${dataApiUrl}/rpc/${name}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${jwt}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) fail(data?.message ?? `HTTP ${response.status}`);
  return data;
}

const args = process.argv.slice(2);
const jwt = await getJwt();

const myRole = await rpc(jwt, 'my_role', {});
if (myRole !== 'developer') fail(`a conta ${email} não é desenvolvedor (cargo atual: ${ROLE_LABELS[myRole] ?? myRole}).`);

if (args.length === 0 || args[0] === '--list') {
  const members = await rpc(jwt, 'list_members', { search: args[1] ?? '', page_size: 100 });
  console.table(members.map((m) => ({ nome: m.full_name, email: m.email, cargo: ROLE_LABELS[m.role] })));
  console.log('Para mudar: npm run role -- <e-mail> <desenvolvedor|administradora|empreendedora>');
} else {
  const [target, roleArg] = args;
  const role = ROLE_ALIASES[(roleArg ?? '').toLowerCase()];
  if (!target?.includes('@') || !role) fail('uso: npm run role -- <e-mail> <desenvolvedor|administradora|empreendedora>');
  const [result] = await rpc(jwt, 'set_member_role_by_email', { target_email: target, new_role: role });
  console.log(`Pronto: ${result.email} agora é ${ROLE_LABELS[result.role]}.`);
}
