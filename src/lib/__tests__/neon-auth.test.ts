import * as SecureStore from 'expo-secure-store';

import { AuthError, neonAuth, parseSetCookie } from '../neon-auth';

jest.mock('../env', () => ({
  env: { authUrl: 'https://auth.exemplo.test/neondb/auth', authOrigin: 'http://localhost' },
}));

const COOKIE = '__Secure-neon-auth.session_token';
const jwtFor = (exp: number) =>
  ['h', globalThis.btoa(JSON.stringify({ exp })).replace(/=+$/, ''), 's'].join('.');

function reply(status: number, body: unknown, headers: Record<string, string> = {}) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers }));
}

const fetchMock = jest.fn();
beforeAll(() => {
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});
beforeEach(() => fetchMock.mockReset());

describe('cookies do Neon Auth', () => {
  it('separa vários Set-Cookie e identifica cookies expirados', () => {
    const cookies = parseSetCookie(
      `${COOKIE}=; Max-Age=0; Path=/; HttpOnly, outro=abc; Expires=Wed, 21 Oct 2026 07:28:00 GMT; Path=/`,
    );
    expect(cookies).toEqual([
      { name: COOKIE, value: '', expired: true },
      { name: 'outro', value: 'abc', expired: false },
    ]);
  });
});

describe('sessão no celular', () => {
  it('entra, guarda o cookie no armazenamento seguro e envia origem e cookie nas próximas chamadas', async () => {
    const exp = Math.floor(Date.now() / 1000) + 900;
    fetchMock
      .mockImplementationOnce(() =>
        reply(200, { token: 't' }, { 'set-cookie': `${COOKIE}=abc.assinatura; Max-Age=604800; Path=/; HttpOnly; Secure` }),
      )
      .mockImplementationOnce(() =>
        reply(
          200,
          { session: { expiresAt: '2099-01-01T00:00:00Z' }, user: { id: 'u1', email: 'ana@exemplo.com', name: 'Ana' } },
          { 'set-auth-jwt': jwtFor(exp) },
        ),
      );

    const session = await neonAuth.signInWithPassword('ana@exemplo.com', 'segura123');

    expect(session.user).toEqual({ id: 'u1', email: 'ana@exemplo.com', name: 'Ana', emailVerified: false });
    const [signInUrl, signInInit] = fetchMock.mock.calls[0];
    expect(signInUrl).toBe('https://auth.exemplo.test/neondb/auth/sign-in/email');
    expect(signInInit).toMatchObject({ method: 'POST', credentials: 'omit' });
    expect(signInInit.headers.origin).toBe('http://localhost');
    expect(fetchMock.mock.calls[1][1].headers.cookie).toBe(`${COOKIE}=abc.assinatura`);
    expect(SecureStore.setItemAsync).toHaveBeenCalled();
    // JWT ainda válido: não chama o servidor de novo.
    expect(await neonAuth.getAccessToken()).toBe(jwtFor(exp));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('traduz erros com o código do Neon Auth em minúsculas', async () => {
    fetchMock.mockImplementationOnce(() => reply(401, { code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid email or password' }));
    const error = await neonAuth.signInWithPassword('ana@exemplo.com', 'errada').catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(AuthError);
    expect(error).toMatchObject({ code: 'invalid_email_or_password', status: 401 });
  });

  it('ao sair, apaga a sessão do aparelho mesmo sem internet', async () => {
    const events: string[] = [];
    const unsubscribe = neonAuth.onAuthStateChange((event) => events.push(event));
    fetchMock.mockImplementationOnce(() => Promise.reject(new TypeError('Network request failed')));
    await neonAuth.signOut();
    unsubscribe();
    expect(neonAuth.getSession()).toBeNull();
    expect(events).toEqual(['SIGNED_OUT']);
    expect(await neonAuth.getAccessToken()).toBeNull();
  });
});
