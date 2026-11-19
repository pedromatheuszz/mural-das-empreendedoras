/**
 * Testes das migrations, regras de negócio e políticas de RLS.
 *
 * Executa o SQL real de database/migrations em um Postgres embutido (PGlite),
 * simulando as roles da Data API do Neon (anonymous/authenticated), o Neon Auth e o JWT.
 * Não precisa de um projeto Neon real: `npm run test:db`.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { before, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { unaccent } from '@electric-sql/pglite/contrib/unaccent';

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, '..', 'migrations');

const ANA = '11111111-1111-4111-8111-111111111111';
const BIA = '22222222-2222-4222-8222-222222222222';
const MOD = '33333333-3333-4333-8333-333333333333';
const DEV = '44444444-4444-4444-8444-444444444444';

/** @type {PGlite} */
let db;
let anaProfileId;
let biaProfileId;

/** Executa `fn` dentro de uma transação como a role/usuária informada (igual ao PostgREST). */
async function as(uid, fn, role = 'authenticated') {
  return db.transaction(async (tx) => {
    const claims = uid ? { sub: uid, role } : { role };
    await tx.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(claims)]);
    await tx.exec(`set local role ${role}`);
    return fn(tx);
  });
}
const asAnon = (fn) => as(null, fn, 'anonymous');

async function insertProfile(tx, userId, data) {
  const columns = Object.keys(data);
  const placeholders = columns.map((_, index) => `$${index + 2}`);
  const result = await tx.query(
    `insert into public.entrepreneur_profiles (user_id, ${columns.join(', ')})
     values ($1, ${placeholders.join(', ')}) returning *`,
    [userId, ...Object.values(data)],
  );
  return result.rows[0];
}

const anaProfile = {
  business_name: '  Doces   da Ana ',
  entrepreneur_name: 'Ana Souza',
  service_description: 'Bolos decorados, doces finos e kits de festa por encomenda em Joinville.',
  category: 'gastronomia',
  city: 'Joinville',
  state: 'sc',
};

before(async () => {
  db = await PGlite.create({ extensions: { pg_trgm, unaccent } });
  await db.exec(readFileSync(join(here, 'neon-stubs.sql'), 'utf8'));
  const files = readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort();
  for (const file of files) {
    try {
      await db.exec(readFileSync(join(migrationsDir, file), 'utf8'));
    } catch (error) {
      throw new Error(`Falha ao aplicar ${file}: ${error.message}`);
    }
  }
});

test('ensure_my_account cria a conta com o nome do Neon Auth e registra o aceite dos termos', async () => {
  await db.query(
    `insert into neon_auth."user" (id, name, email) values
       ($1, '  Ana   Souza ', 'ana@example.com'),
       ($2, 'Bia Lima', 'bia@example.com'),
       ($3, '', 'mod@example.com')`,
    [ANA, BIA, MOD],
  );
  await assert.rejects(asAnon((tx) => tx.query(`select public.ensure_my_account('2026-11')`)), /permission denied/);

  await as(ANA, (tx) => tx.query(`select public.ensure_my_account('2026-11')`));
  await as(BIA, (tx) => tx.query(`select public.ensure_my_account('2026-11')`));
  await as(MOD, (tx) => tx.query(`select public.ensure_my_account()`));
  // Chamar de novo (a cada login) não duplica nem apaga o aceite já registrado.
  const again = await as(ANA, (tx) => tx.query(`select (public.ensure_my_account()).terms_version`));
  assert.equal(again.rows[0].terms_version, '2026-11');

  const { rows } = await db.query(`select * from public.users order by email`);
  assert.equal(rows.length, 3);
  assert.equal(rows[0].full_name, 'Ana Souza');
  assert.equal(rows[0].terms_version, '2026-11');
  assert.ok(rows[0].terms_accepted_at);
  assert.equal(rows[2].full_name, 'mod', 'sem nome, usa o início do e-mail');
  assert.equal(rows[2].terms_accepted_at, null);
});

test('usuária lê apenas os próprios dados de conta; visitante não lê nada', async () => {
  const own = await as(ANA, (tx) => tx.query(`select id, email from public.users`));
  assert.deepEqual(own.rows.map((row) => row.id), [ANA]);
  await assert.rejects(asAnon((tx) => tx.query(`select * from public.users`)), /permission denied/);
});

test('usuária altera o próprio nome, mas não o e-mail nem dados de outra conta', async () => {
  const updated = await as(ANA, (tx) =>
    tx.query(`update public.users set full_name = 'Ana S. Souza' where id = $1`, [ANA]),
  );
  assert.equal(updated.affectedRows, 1);
  await assert.rejects(
    as(ANA, (tx) => tx.query(`update public.users set email = 'x@x.com' where id = $1`, [ANA])),
    /permission denied/,
  );
  const other = await as(ANA, (tx) =>
    tx.query(`update public.users set full_name = 'Hacker' where id = $1`, [BIA]),
  );
  assert.equal(other.affectedRows, 0);
});

test('troca de e-mail feita no Neon Auth é sincronizada no próximo login', async () => {
  await db.query(`update neon_auth."user" set email = 'ana.souza@example.com' where id = $1`, [ANA]);
  await as(ANA, (tx) => tx.query(`select public.ensure_my_account()`));
  const { rows } = await db.query(`select email from public.users where id = $1`, [ANA]);
  assert.equal(rows[0].email, 'ana.souza@example.com');
});

test('perfil criado como rascunho é sanitizado e fica visível só para a dona', async () => {
  const profile = await as(ANA, (tx) => insertProfile(tx, ANA, anaProfile));
  anaProfileId = profile.id;
  assert.equal(profile.business_name, 'Doces da Ana');
  assert.equal(profile.state, 'SC');
  assert.equal(profile.publication_status, 'draft');
  assert.equal(profile.published_at, null);

  const publicRows = await asAnon((tx) => tx.query(`select id from public.entrepreneur_profiles`));
  assert.equal(publicRows.rows.length, 0);
  const otherRows = await as(BIA, (tx) => tx.query(`select id from public.entrepreneur_profiles`));
  assert.equal(otherRows.rows.length, 0);
  const ownRows = await as(ANA, (tx) => tx.query(`select id from public.entrepreneur_profiles`));
  assert.equal(ownRows.rows.length, 1);
});

test('não é possível criar perfil em nome de outra conta', async () => {
  await assert.rejects(
    as(BIA, (tx) => insertProfile(tx, ANA, { ...anaProfile, business_name: 'Golpe' })),
    /row-level security/,
  );
});

test('cada conta possui apenas um perfil empresarial (MVP)', async () => {
  await assert.rejects(
    as(ANA, (tx) => insertProfile(tx, ANA, { ...anaProfile, business_name: 'Segunda marca' })),
    /entrepreneur_profiles_one_per_user_idx/,
  );
});

test('visitantes não podem criar perfis', async () => {
  await assert.rejects(asAnon((tx) => insertProfile(tx, ANA, anaProfile)), /permission denied/);
});

test('publicar exige consentimento; data do consentimento e da publicação vêm do servidor', async () => {
  await assert.rejects(
    as(ANA, (tx) =>
      tx.query(`update public.entrepreneur_profiles set publication_status = 'published' where id = $1`, [
        anaProfileId,
      ]),
    ),
    /entrepreneur_profiles_published_requires_consent/,
  );

  const { rows } = await as(ANA, (tx) =>
    tx.query(
      `update public.entrepreneur_profiles
          set publication_status = 'published', public_consent_at = '2000-01-01', published_at = '2000-01-01'
        where id = $1
        returning public_consent_at, published_at`,
      [anaProfileId],
    ),
  );
  const year = new Date().getFullYear();
  assert.equal(new Date(rows[0].public_consent_at).getFullYear(), year);
  assert.equal(new Date(rows[0].published_at).getFullYear(), year);
});

test('perfil publicado pode ser lido por qualquer pessoa', async () => {
  const anon = await asAnon((tx) => tx.query(`select business_name from public.entrepreneur_profiles`));
  assert.deepEqual(anon.rows, [{ business_name: 'Doces da Ana' }]);
  const other = await as(BIA, (tx) => tx.query(`select business_name from public.entrepreneur_profiles`));
  assert.equal(other.rows.length, 1);
});

test('a empreendedora não altera a data de publicação nem forja consentimento', async () => {
  const { rows } = await as(ANA, (tx) =>
    tx.query(
      `update public.entrepreneur_profiles set published_at = '1999-01-01', public_consent_at = null
        where id = $1 returning published_at, public_consent_at`,
      [anaProfileId],
    ),
  );
  assert.notEqual(new Date(rows[0].published_at).getFullYear(), 1999);
  assert.ok(rows[0].public_consent_at, 'o registro de consentimento é mantido');
});

test('URLs com esquemas perigosos são rejeitadas pelo banco', async () => {
  await assert.rejects(
    as(ANA, (tx) =>
      tx.query(`update public.entrepreneur_profiles set website_url = 'javascript:alert(1)' where id = $1`, [
        anaProfileId,
      ]),
    ),
    /entrepreneur_profiles_website_url_format/,
  );
  await assert.rejects(
    as(ANA, (tx) =>
      tx.query(`update public.entrepreneur_profiles set community_perks = '{vip}' where id = $1`, [anaProfileId]),
    ),
    /entrepreneur_profiles_perks_valid/,
  );
});

test('outra usuária não edita nem exclui o perfil de ninguém', async () => {
  const update = await as(BIA, (tx) =>
    tx.query(`update public.entrepreneur_profiles set business_name = 'Invadido' where id = $1`, [anaProfileId]),
  );
  assert.equal(update.affectedRows, 0);
  const remove = await as(BIA, (tx) =>
    tx.query(`delete from public.entrepreneur_profiles where id = $1`, [anaProfileId]),
  );
  assert.equal(remove.affectedRows, 0);
});

test('a empreendedora não pode suspender o próprio perfil', async () => {
  await assert.rejects(
    as(ANA, (tx) =>
      tx.query(`update public.entrepreneur_profiles set publication_status = 'suspended' where id = $1`, [
        anaProfileId,
      ]),
    ),
    /Somente a moderação/,
  );
});

test('busca ignora acentos, exige todos os termos e mostra apenas perfis publicados', async () => {
  const bia = await as(BIA, (tx) =>
    insertProfile(tx, BIA, {
      business_name: 'Estúdio Bia Estética',
      entrepreneur_name: 'Bia Lima',
      service_description: 'Design de sobrancelhas, limpeza de pele e massagem relaxante.',
      category: 'beleza',
      city: 'São Paulo',
      state: 'SP',
      community_perks: ['hub-discount', 'priority-service', 'hub-discount'],
      publication_status: 'published',
      public_consent_at: new Date().toISOString(),
    }),
  );
  biaProfileId = bia.id;
  assert.deepEqual(bia.community_perks, ['hub-discount', 'priority-service'], 'remove duplicadas e ordena');

  await as(MOD, (tx) =>
    insertProfile(tx, MOD, {
      business_name: 'Rascunho Secreto',
      entrepreneur_name: 'Moderadora',
      service_description: 'Este perfil é um rascunho e não deve aparecer na busca.',
    }),
  );

  const search = (query, category = null) =>
    asAnon((tx) =>
      tx.query(`select business_name from public.search_entrepreneur_profiles($1, $2, 20, 0)`, [query, category]),
    ).then((result) => result.rows.map((row) => row.business_name));

  assert.deepEqual(await search('estetica'), ['Estúdio Bia Estética']);
  assert.deepEqual(await search('SAO paulo'), ['Estúdio Bia Estética']);
  assert.deepEqual(await search('bolos joinville'), ['Doces da Ana']);
  assert.deepEqual(await search('bolos estetica'), []);
  assert.deepEqual(await search('ana souza'), ['Doces da Ana']);
  assert.deepEqual(await search('rascunho'), []);
  assert.deepEqual(await search('%'), [], 'curingas digitados são tratados como texto');
  assert.deepEqual(await search('', 'beleza'), ['Estúdio Bia Estética']);
  assert.deepEqual(await search(''), ['Doces da Ana', 'Estúdio Bia Estética']);
});

test('denúncias: qualquer usuária denuncia perfis publicados de outras, sem duplicar', async () => {
  await as(BIA, (tx) =>
    tx.query(`insert into public.profile_reports (profile_id, reporter_id, reason, details) values ($1, $2, 'spam', 'Propaganda')`, [
      anaProfileId,
      BIA,
    ]),
  );
  await assert.rejects(
    as(BIA, (tx) =>
      tx.query(`insert into public.profile_reports (profile_id, reporter_id, reason) values ($1, $2, 'fake')`, [
        anaProfileId,
        BIA,
      ]),
    ),
    /profile_reports_one_open_per_reporter_idx/,
  );
  await assert.rejects(
    as(ANA, (tx) =>
      tx.query(`insert into public.profile_reports (profile_id, reporter_id, reason) values ($1, $2, 'spam')`, [
        anaProfileId,
        ANA,
      ]),
    ),
    /row-level security/,
    'não pode denunciar o próprio perfil',
  );
  await assert.rejects(
    asAnon((tx) => tx.query(`insert into public.profile_reports (profile_id, reason) values ($1, 'spam')`, [biaProfileId])),
    /permission denied/,
  );
  const own = await as(BIA, (tx) => tx.query(`select reason from public.profile_reports`));
  assert.deepEqual(own.rows, [{ reason: 'spam' }]);
  const ana = await as(ANA, (tx) => tx.query(`select id from public.profile_reports`));
  assert.equal(ana.rows.length, 0, 'a denunciada não vê quem denunciou');
});

test('moderação suspende; a empreendedora vê o motivo, edita conteúdo, mas não reativa', async () => {
  await assert.rejects(
    as(ANA, (tx) => tx.query(`select public.moderate_profile($1, 'suspended', 'teste')`, [biaProfileId])),
    /Apenas a moderação/,
  );

  await db.query(`insert into public.user_roles (user_id, role) values ($1, 'administrator')`, [MOD]);
  await as(MOD, (tx) =>
    tx.query(`select public.moderate_profile($1, 'suspended', 'Conteúdo em desacordo com as regras')`, [anaProfileId]),
  );

  const publicRows = await asAnon((tx) => tx.query(`select id from public.entrepreneur_profiles where id = $1`, [anaProfileId]));
  assert.equal(publicRows.rows.length, 0, 'perfil suspenso sai do Mural');

  const own = await as(ANA, (tx) =>
    tx.query(`select publication_status, suspension_reason, suspended_at from public.entrepreneur_profiles where id = $1`, [
      anaProfileId,
    ]),
  );
  assert.equal(own.rows[0].publication_status, 'suspended');
  assert.equal(own.rows[0].suspension_reason, 'Conteúdo em desacordo com as regras');
  assert.ok(own.rows[0].suspended_at);

  await assert.rejects(
    as(ANA, (tx) =>
      tx.query(`update public.entrepreneur_profiles set publication_status = 'published' where id = $1`, [anaProfileId]),
    ),
    /suspenso pela moderação/,
  );
  const edit = await as(ANA, (tx) =>
    tx.query(
      `update public.entrepreneur_profiles set service_description = 'Bolos e doces artesanais para festas e eventos.', suspension_reason = null
        where id = $1 returning suspension_reason`,
      [anaProfileId],
    ),
  );
  assert.equal(edit.rows[0].suspension_reason, 'Conteúdo em desacordo com as regras', 'motivo não pode ser apagado');

  await as(MOD, (tx) => tx.query(`select public.moderate_profile($1, 'published')`, [anaProfileId]));
  const restored = await asAnon((tx) =>
    tx.query(`select suspension_reason from public.entrepreneur_profiles where id = $1`, [anaProfileId]),
  );
  assert.deepEqual(restored.rows, [{ suspension_reason: null }]);
});

test('registro de auditoria guarda as mudanças e só a moderação lê', async () => {
  const { rows } = await db.query(
    `select action, changed_fields from public.profile_audit_log where profile_id = $1 order by id`,
    [anaProfileId],
  );
  const actions = rows.map((row) => row.action);
  assert.equal(actions[0], 'created');
  assert.ok(actions.includes('status_changed'));
  assert.ok(actions.includes('updated'));
  assert.ok(rows.some((row) => row.changed_fields.includes('service_description')));

  const ana = await as(ANA, (tx) => tx.query(`select id from public.profile_audit_log`));
  assert.equal(ana.rows.length, 0);
  const mod = await as(MOD, (tx) => tx.query(`select id from public.profile_audit_log`));
  assert.ok(mod.rows.length > 0);
});

test('cargos: desenvolvedor, administradora e empreendedora têm permissões diferentes', async () => {
  await db.query(`insert into neon_auth."user" (id, name, email) values ($1, 'Dev', 'dev@example.com')`, [DEV]);
  await as(DEV, (tx) => tx.query(`select public.ensure_my_account()`));
  await db.query(`insert into public.user_roles (user_id, role) values ($1, 'developer')`, [DEV]);

  const roleOf = async (uid) => (await as(uid, (tx) => tx.query(`select public.my_role() as role`))).rows[0].role;
  assert.equal(await roleOf(ANA), 'entrepreneur');
  assert.equal(await roleOf(MOD), 'administrator');
  assert.equal(await roleOf(DEV), 'developer');
  // Sem a conta identificada no JWT, my_role() falha em vez de responder "entrepreneur".
  await assert.rejects(as(null, (tx) => tx.query(`select public.my_role()`)), /Sessão não identificada/);

  // Administradora: modera (suspende/reativa), mas não edita nem exclui o perfil de outra empreendedora.
  await assert.rejects(
    as(MOD, (tx) => tx.query(`update public.entrepreneur_profiles set business_name = 'Alterado' where id = $1`, [biaProfileId])),
    /Somente a dona do perfil/,
  );
  await as(MOD, (tx) => tx.query(`select public.moderate_profile($1, 'suspended', 'Teste de cargo')`, [biaProfileId]));
  await as(MOD, (tx) => tx.query(`select public.moderate_profile($1, 'published')`, [biaProfileId]));
  const modDelete = await as(MOD, (tx) => tx.query(`delete from public.entrepreneur_profiles where id = $1`, [biaProfileId]));
  assert.equal(modDelete.affectedRows, 0);

  // Desenvolvedor: edita o conteúdo de qualquer perfil.
  const devEdit = await as(DEV, (tx) =>
    tx.query(`update public.entrepreneur_profiles set business_name = 'Ateliê da Bia' where id = $1 returning business_name`, [
      biaProfileId,
    ]),
  );
  assert.equal(devEdit.rows[0].business_name, 'Ateliê da Bia');

  // Denúncias abertas: só a equipe vê.
  const anaReports = await as(ANA, (tx) => tx.query(`select * from public.list_open_reports()`));
  const modReports = await as(MOD, (tx) => tx.query(`select * from public.list_open_reports()`));
  assert.ok(modReports.rows.length > 0);
  assert.ok(anaReports.rows.every((row) => modReports.rows.some((r) => r.id === row.id)), 'empreendedora vê só as próprias');

  // Gestão de cargos: somente o desenvolvedor.
  await assert.rejects(as(MOD, (tx) => tx.query(`select * from public.list_members()`)), /Apenas o desenvolvedor/);
  await assert.rejects(
    as(MOD, (tx) => tx.query(`select public.set_member_role($1, 'administrator')`, [BIA])),
    /Apenas o desenvolvedor/,
  );
  const members = await as(DEV, (tx) => tx.query(`select id, role from public.list_members('')`));
  assert.equal(members.rows.find((row) => row.id === MOD).role, 'administrator');
  await as(DEV, (tx) => tx.query(`select public.set_member_role($1, 'administrator')`, [BIA]));
  assert.equal(await roleOf(BIA), 'administrator');
  await as(DEV, (tx) => tx.query(`select public.set_member_role($1, 'entrepreneur')`, [BIA]));
  assert.equal(await roleOf(BIA), 'entrepreneur');
  await assert.rejects(
    as(DEV, (tx) => tx.query(`select public.set_member_role($1, 'entrepreneur')`, [DEV])),
    /próprio cargo/,
  );
  await assert.rejects(as(DEV, (tx) => tx.query(`select public.set_member_role($1, 'rainha')`, [BIA])), /Cargo inválido/);

  // Pela API, também por e-mail (inclusive conta que ainda não abriu o app).
  const NEW = '55555555-5555-4555-8555-555555555555';
  await db.query(`insert into neon_auth."user" (id, name, email) values ($1, 'Nova Admin', 'Nova.Admin@example.com')`, [NEW]);
  await assert.rejects(
    as(MOD, (tx) => tx.query(`select * from public.set_member_role_by_email('nova.admin@example.com', 'administrator')`)),
    /Apenas o desenvolvedor/,
  );
  const byEmail = await as(DEV, (tx) =>
    tx.query(`select * from public.set_member_role_by_email(' NOVA.admin@example.com ', 'administrator')`),
  );
  assert.deepEqual(byEmail.rows, [{ id: NEW, email: 'Nova.Admin@example.com', role: 'administrator' }]);
  assert.equal(await roleOf(NEW), 'administrator');
  await assert.rejects(
    as(DEV, (tx) => tx.query(`select * from public.set_member_role_by_email('ninguem@example.com', 'administrator')`)),
    /Nenhuma conta com o e-mail/,
  );

  // Desenvolvedor exclui o perfil de outra conta (aqui, o perfil de teste da administradora).
  const devDelete = await as(DEV, (tx) => tx.query(`delete from public.entrepreneur_profiles where user_id = $1`, [MOD]));
  assert.equal(devDelete.affectedRows, 1);
});

test('exclusão de conta remove a conta e os dados associados', async () => {
  await assert.rejects(asAnon((tx) => tx.query(`select public.delete_my_account()`)), /permission denied/);

  await as(ANA, (tx) => tx.query(`select public.delete_my_account()`));

  const auth = await db.query(`select id from neon_auth."user" where id = $1`, [ANA]);
  const account = await db.query(`select id from public.users where id = $1`, [ANA]);
  const profile = await db.query(`select id from public.entrepreneur_profiles where user_id = $1`, [ANA]);
  const reports = await db.query(`select id from public.profile_reports where profile_id = $1`, [anaProfileId]);
  const audit = await db.query(`select action from public.profile_audit_log where profile_id = $1 order by id desc limit 1`, [
    anaProfileId,
  ]);
  assert.equal(auth.rows.length, 0);
  assert.equal(account.rows.length, 0);
  assert.equal(profile.rows.length, 0);
  assert.equal(reports.rows.length, 0);
  assert.equal(audit.rows[0].action, 'deleted', 'auditoria mantém apenas o metadado da exclusão');
});

test('perfis da organização: só a moderação cria; usuárias comuns não editam', async () => {
  const curated = {
    business_name: 'Perfil da Organização',
    entrepreneur_name: 'Integrante do grupo',
    service_description: 'Perfil cadastrado pela organização para teste de permissões.',
    publication_status: 'published',
    public_consent_at: new Date().toISOString(),
  };
  await assert.rejects(as(BIA, (tx) => insertProfile(tx, null, curated)), /row-level security/);

  await assert.rejects(as(MOD, (tx) => insertProfile(tx, ANA, curated)), /row-level security|duplicate|único|unique/);
  const created = await as(MOD, (tx) => insertProfile(tx, null, curated));
  assert.equal(created.user_id, null);

  const update = await as(BIA, (tx) =>
    tx.query(`update public.entrepreneur_profiles set business_name = 'Invadido' where id = $1`, [created.id]),
  );
  assert.equal(update.affectedRows, 0);

  await as(BIA, (tx) =>
    tx.query(`insert into public.profile_reports (profile_id, reporter_id, reason) values ($1, $2, 'fake')`, [
      created.id,
      BIA,
    ]),
  );

  const removed = await as(MOD, (tx) => tx.query(`delete from public.entrepreneur_profiles where id = $1`, [created.id]));
  assert.equal(removed.affectedRows, 1);
});

test('dados do grupo Joinville Empreendedoras: 87 perfis publicados, sem duplicar', async () => {
  const seed = readFileSync(join(here, '..', 'seed', 'joinville-empreendedoras.sql'), 'utf8');
  await db.exec(seed);
  await db.exec(seed); // executar de novo não pode duplicar

  const { rows } = await db.query(
    `select business_name, publication_status, instagram_url, city, state, public_consent_at
       from public.entrepreneur_profiles where user_id is null`,
  );
  assert.equal(rows.length, 87);
  assert.ok(rows.every((row) => row.publication_status === 'published' && row.public_consent_at));
  assert.ok(rows.every((row) => row.city === 'Joinville' && row.state === 'SC'));
  assert.equal(new Set(rows.map((row) => row.business_name)).size, 87, 'nomes únicos');

  const links = rows.map((row) => row.instagram_url).filter(Boolean);
  assert.equal(links.length, 84, '3 perfis ficam sem Instagram até a organização confirmar o @');
  assert.equal(new Set(links).size, links.length, 'nenhum Instagram repetido');
  assert.ok(links.every((url) => /^https:\/\/www\.instagram\.com\/[a-z0-9._]{1,30}$/.test(url)), 'links válidos');

  const visible = await asAnon((tx) => tx.query(`select count(*)::int as total from public.entrepreneur_profiles`));
  assert.equal(visible.rows[0].total, 88, '87 do grupo + 1 perfil publicado da Bia');

  const search = await asAnon((tx) =>
    tx.query(`select business_name from public.search_entrepreneur_profiles('empadao', null, 20, 0)`),
  );
  assert.deepEqual(
    search.rows.map((row) => row.business_name),
    ['Camii Sabores e Camadas', 'Delícias da Kah'],
    'busca sem acento encontra "empadão"',
  );
});
