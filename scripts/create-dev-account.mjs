/**
 * Cria (ou atualiza) a conta de desenvolvedor no Neon Auth com os dados de
 * EXPO_PUBLIC_DEV_LOGIN_EMAIL / EXPO_PUBLIC_DEV_LOGIN_PASSWORD do .env, já com o e-mail
 * confirmado e o cargo "developer" (Desenvolvedor). Uso: npm run dev:account
 */
import pg from 'pg';

const { EXPO_PUBLIC_NEON_AUTH_URL: base, EXPO_PUBLIC_DEV_LOGIN_EMAIL: rawEmail, EXPO_PUBLIC_DEV_LOGIN_PASSWORD: password, NEON_DATABASE_URL: url } =
  process.env;
if (!base || !rawEmail || !password || !url) {
  console.error('Defina EXPO_PUBLIC_NEON_AUTH_URL, EXPO_PUBLIC_DEV_LOGIN_EMAIL, EXPO_PUBLIC_DEV_LOGIN_PASSWORD e NEON_DATABASE_URL no .env.');
  process.exit(1);
}
const email = rawEmail.trim().toLowerCase();
const origin = new URL(base).origin;

const response = await fetch(`${base}/sign-up/email`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', origin },
  body: JSON.stringify({ email, password, name: 'Desenvolvedor' }),
});
if (!response.ok) console.log(`cadastro: ${response.status} (a conta pode já existir)`);

const client = new pg.Client({ connectionString: url.replace('sslmode=require', 'sslmode=verify-full') });
await client.connect();
try {
  const { rows } = await client.query(`update neon_auth."user" set "emailVerified" = true where lower(email) = $1 returning id, name`, [email]);
  if (!rows[0]) throw new Error('Conta não encontrada no Neon Auth.');
  const { id, name } = rows[0];
  await client.query(
    `insert into public.users (id, full_name, email, terms_accepted_at, terms_version)
     values ($1, $2, $3, now(), 'dev') on conflict (id) do update set email = excluded.email`,
    [id, name || 'Desenvolvedor', email],
  );
  await client.query(`insert into public.user_roles (user_id, role) values ($1, 'developer') on conflict (user_id) do update set role = 'developer'`, [id]);
  console.log('Conta de desenvolvedor pronta (e-mail confirmado, cargo Desenvolvedor).');
} finally {
  await client.end();
}
