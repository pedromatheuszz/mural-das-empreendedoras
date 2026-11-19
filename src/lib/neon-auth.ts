import { Platform } from 'react-native';

import { env } from './env';
import { secureStorage } from './secure-storage';

/**
 * Cliente do Neon Auth (Better Auth gerenciado pelo Neon), feito para React Native.
 *
 * O Neon Auth mantém a sessão em um cookie HttpOnly. Como o app não é um navegador,
 * o cookie de sessão é guardado no Keychain/Keystore (expo-secure-store) e enviado
 * manualmente. Para ler o banco pela Data API, troca-se a sessão por um JWT curto
 * (15 min), mantido só em memória e renovado automaticamente.
 */

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
};

export type AuthSession = {
  user: AuthUser;
  expiresAt: string;
};

export type AuthEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED';

/** Erro devolvido pelo Neon Auth, com o código em minúsculas (ex.: "invalid_email_or_password"). */
export class AuthError extends Error {
  readonly code: string;
  readonly status: number;
  readonly __isAuthError = true;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
  }
}

const COOKIE_STORAGE_KEY = 'mural.auth.cookies';
/** Cópia da sessão para abrir o app sem internet (os dados vêm do cache local). */
const SESSION_STORAGE_KEY = 'mural.auth.session';
const JWT_SAFETY_MS = 60_000;
const isWeb = Platform.OS === 'web';

let cookies: Record<string, string> = {};
let cookiesLoaded: Promise<void> | null = null;
let session: AuthSession | null = null;
let jwt: { token: string; expiresAt: number } | null = null;
const listeners = new Set<(event: AuthEvent, session: AuthSession | null) => void>();

function loadCookies(): Promise<void> {
  cookiesLoaded ??= secureStorage
    .getItem(COOKIE_STORAGE_KEY)
    .then((raw) => {
      if (raw) cookies = JSON.parse(raw) as Record<string, string>;
    })
    .catch(() => {
      cookies = {};
    });
  return cookiesLoaded;
}

async function saveCookies(): Promise<void> {
  if (Object.keys(cookies).length === 0) await secureStorage.removeItem(COOKIE_STORAGE_KEY);
  else await secureStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(cookies));
}

/** Separa vários Set-Cookie que chegam unidos por vírgula (sem quebrar "Expires=Wed, 21 Oct"). */
export function parseSetCookie(header: string): { name: string; value: string; expired: boolean }[] {
  return header
    .split(/,(?=\s*[^;,=\s]+=)/)
    .map((part) => {
      const [pair = '', ...attributes] = part.split(';');
      const separator = pair.indexOf('=');
      const name = pair.slice(0, separator).trim();
      const value = pair.slice(separator + 1).trim();
      const expired =
        value === '' ||
        attributes.some((attribute) => /^\s*max-age\s*=\s*(0|-\d+)\s*$/i.test(attribute));
      return { name, value, expired };
    })
    .filter((cookie) => cookie.name.length > 0);
}

async function storeResponseCookies(response: Response): Promise<void> {
  const header = response.headers.get('set-cookie');
  if (!header) return;
  let changed = false;
  for (const cookie of parseSetCookie(header)) {
    if (cookie.expired) {
      if (cookie.name in cookies) delete cookies[cookie.name];
      else continue;
    } else {
      cookies[cookie.name] = cookie.value;
    }
    changed = true;
  }
  if (changed) await saveCookies();
}

function cookieHeader(): string {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

type RequestOptions = { method?: 'GET' | 'POST'; body?: Record<string, unknown> };

async function request<T>(path: string, { method = 'POST', body }: RequestOptions = {}): Promise<{ data: T; response: Response }> {
  await loadCookies();
  const headers: Record<string, string> = { accept: 'application/json' };
  if (body) headers['content-type'] = 'application/json';
  if (!isWeb) {
    // No celular não há navegador: informamos a origem confiável e o cookie da sessão.
    headers.origin = env.authOrigin;
    const cookie = cookieHeader();
    if (cookie) headers.cookie = cookie;
  }

  const response = await fetch(`${env.authUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    // Na web o navegador cuida do cookie; no celular quem cuida é este módulo.
    credentials: isWeb ? 'include' : 'omit',
  });
  await storeResponseCookies(response);

  const textBody = await response.text();
  let data: unknown = null;
  if (textBody) {
    try {
      data = JSON.parse(textBody);
    } catch {
      data = null;
    }
  }
  if (!response.ok) {
    const info = (data ?? {}) as { code?: string; message?: string };
    throw new AuthError(
      info.message ?? `Falha na autenticação (${response.status}).`,
      (info.code ?? (response.status === 429 ? 'too_many_requests' : `http_${response.status}`)).toLowerCase(),
      response.status,
    );
  }
  return { data: data as T, response };
}

function decodeJwtExpiry(token: string): number {
  try {
    const payload = token.split('.')[1] ?? '';
    const json = globalThis.atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const exp = (JSON.parse(json) as { exp?: number }).exp;
    return typeof exp === 'number' ? exp * 1000 : Date.now() + 5 * 60_000;
  } catch {
    return Date.now() + 5 * 60_000;
  }
}

function rememberJwt(token: string | null | undefined) {
  jwt = token ? { token, expiresAt: decodeJwtExpiry(token) } : null;
}

type RawUser = { id: string; email: string; name?: string | null; emailVerified?: boolean };
type RawSession = { session: { expiresAt: string }; user: RawUser } | null;

const toUser = (user: RawUser): AuthUser => ({
  id: user.id,
  email: user.email,
  name: user.name ?? '',
  emailVerified: user.emailVerified === true,
});

function emit(event: AuthEvent) {
  for (const listener of listeners) listener(event, session);
}

async function clearLocalSession(notify: boolean) {
  const hadSession = session !== null;
  session = null;
  jwt = null;
  cookies = {};
  cookiesLoaded = Promise.resolve();
  await secureStorage.removeItem(COOKIE_STORAGE_KEY).catch(() => undefined);
  await secureStorage.removeItem(SESSION_STORAGE_KEY).catch(() => undefined);
  if (notify && hadSession) emit('SIGNED_OUT');
}

/** Busca a sessão atual no servidor (e o JWT que vem junto, no cabeçalho set-auth-jwt). */
async function fetchSession(): Promise<AuthSession | null> {
  const { data, response } = await request<RawSession>('/get-session', { method: 'GET' });
  if (!data?.user) {
    session = null;
    jwt = null;
    return null;
  }
  rememberJwt(response.headers.get('set-auth-jwt'));
  session = { user: toUser(data.user), expiresAt: data.session.expiresAt };
  await secureStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session)).catch(() => undefined);
  return session;
}

async function afterSignIn(): Promise<AuthSession> {
  const current = await fetchSession();
  if (!current) throw new AuthError('Não foi possível iniciar a sessão.', 'session_not_found', 401);
  emit('SIGNED_IN');
  return current;
}

/** Restauração da sessão em andamento (as requisições esperam por ela). */
let restoring: Promise<AuthSession | null> | null = null;
/** Pedido de JWT em andamento (várias telas pedindo ao mesmo tempo fazem uma chamada só). */
let tokenRequest: Promise<string | null> | null = null;

async function restore(): Promise<AuthSession | null> {
  await loadCookies();
  if (!isWeb && Object.keys(cookies).length === 0) return null;
  try {
    return await fetchSession();
  } catch (error) {
    if (error instanceof AuthError) throw error;
    // Sem internet: usa a última sessão conhecida, se ainda não expirou.
    const raw = await secureStorage.getItem(SESSION_STORAGE_KEY).catch(() => null);
    const cached = raw ? (JSON.parse(raw) as AuthSession) : null;
    session = cached && new Date(cached.expiresAt).getTime() > Date.now() ? cached : null;
    return session;
  }
}

async function requestToken(): Promise<string | null> {
  try {
    const { data } = await request<{ token?: string }>('/token', { method: 'GET' });
    rememberJwt(data?.token);
  } catch (error) {
    if (error instanceof AuthError && error.status === 401) {
      await clearLocalSession(true);
      return null;
    }
    throw error;
  }
  return jwt?.token ?? null;
}

export const neonAuth = {
  /** Restaura a sessão salva no aparelho. Sem internet, mantém a usuária desconectada. */
  restoreSession(): Promise<AuthSession | null> {
    restoring ??= restore().finally(() => {
      restoring = null;
    });
    return restoring;
  },

  getSession(): AuthSession | null {
    return session;
  },

  onAuthStateChange(listener: (event: AuthEvent, session: AuthSession | null) => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /** JWT para a Data API. Renova sozinho quando está perto de expirar. */
  async getAccessToken(): Promise<string | null> {
    // Uma tela aberta direto (link, recarregar a página) não pode sair sem o token
    // enquanto a sessão salva ainda está sendo restaurada.
    if (restoring) await restoring.catch(() => null);
    if (jwt && jwt.expiresAt - JWT_SAFETY_MS > Date.now()) return jwt.token;
    if (!session) return null;
    tokenRequest ??= requestToken().finally(() => {
      tokenRequest = null;
    });
    return tokenRequest;
  },

  async signInWithPassword(email: string, password: string): Promise<AuthSession> {
    await request('/sign-in/email', { body: { email, password, rememberMe: true } });
    return afterSignIn();
  },

  /** Cria a conta. Com a confirmação de e-mail ativa, a sessão só começa após o código. */
  async signUp(params: { email: string; password: string; name: string }): Promise<{ session: AuthSession | null }> {
    const { data } = await request<{ token: string | null }>('/sign-up/email', { body: params });
    if (!data?.token) return { session: null };
    return { session: await afterSignIn() };
  },

  sendVerificationCode(email: string, type: 'email-verification' | 'forget-password') {
    return request('/email-otp/send-verification-otp', { body: { email, type } });
  },

  /** Confirma o e-mail com o código; o Neon Auth já inicia a sessão em seguida. */
  async verifyEmail(email: string, otp: string): Promise<AuthSession | null> {
    await request('/email-otp/verify-email', { body: { email, otp } });
    const current = await fetchSession();
    if (current) emit('SIGNED_IN');
    return current;
  },

  checkVerificationCode(email: string, otp: string, type: 'email-verification' | 'forget-password') {
    return request('/email-otp/check-verification-otp', { body: { email, otp, type } });
  },

  resetPassword(email: string, otp: string, password: string) {
    return request('/email-otp/reset-password', { body: { email, otp, password } });
  },

  changePassword(currentPassword: string, newPassword: string) {
    return request('/change-password', { body: { currentPassword, newPassword, revokeOtherSessions: true } });
  },

  async updateName(name: string): Promise<void> {
    await request('/update-user', { body: { name } });
    if (session) {
      session = { ...session, user: { ...session.user, name } };
      emit('USER_UPDATED');
    }
  },

  /** Encerra a sessão no servidor (se possível) e sempre apaga a sessão do aparelho. */
  async signOut(): Promise<void> {
    try {
      await request('/sign-out', { body: {} });
    } catch {
      // Sem internet ou sessão já expirada: a saída local continua valendo.
    }
    await clearLocalSession(true);
  },

  /** Usado após excluir a conta: a sessão já não existe no servidor. */
  clearLocalSession: () => clearLocalSession(true),
};
