/**
 * Tradução de erros técnicos (Neon Auth, Data API/PostgREST, Cloudinary, rede)
 * para mensagens claras em português.
 */
export class AppError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

const GENERIC_MESSAGE = 'Algo deu errado. Tente novamente em instantes.';
export const NETWORK_MESSAGE = 'Sem conexão com o servidor. Verifique sua internet e tente novamente.';

const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  invalid_email_or_password: 'E-mail ou senha incorretos.',
  email_not_verified: 'Confirme seu e-mail para entrar. Enviamos um código para a sua caixa de entrada.',
  invalid_otp: 'Código inválido ou expirado. Peça um novo código.',
  too_many_attempts: 'Muitas tentativas com este código. Peça um novo código.',
  password_too_short: 'Escolha uma senha mais forte: pelo menos 8 caracteres, com letras e números.',
  password_too_long: 'A senha é longa demais.',
  too_many_requests: 'Muitas tentativas seguidas. Aguarde um pouco e tente novamente.',
  invalid_origin: 'O aplicativo não está autorizado no servidor de login. Fale com o suporte.',
  email_not_confirmed: 'Confirme seu e-mail para entrar. Enviamos um código para a sua caixa de entrada.',
  user_already_exists: 'Já existe uma conta com este e-mail. Entre ou recupere sua senha.',
  email_exists: 'Já existe uma conta com este e-mail. Entre ou recupere sua senha.',
  weak_password: 'Escolha uma senha mais forte: pelo menos 8 caracteres, com letras e números.',
  same_password: 'A nova senha precisa ser diferente da senha atual.',
  over_email_send_rate_limit: 'Muitos e-mails enviados em pouco tempo. Aguarde alguns minutos e tente de novo.',
  over_request_rate_limit: 'Muitas tentativas seguidas. Aguarde um pouco e tente novamente.',
  over_sms_send_rate_limit: 'Muitas tentativas seguidas. Aguarde um pouco e tente novamente.',
  otp_expired: 'Código inválido ou expirado. Peça um novo código.',
  otp_disabled: 'A verificação por código está desativada no momento.',
  email_address_invalid: 'Informe um e-mail válido.',
  email_address_not_authorized: 'Não foi possível enviar e-mail para este endereço. Fale com o suporte.',
  signup_disabled: 'Novos cadastros estão temporariamente desativados.',
  user_not_found: 'Não encontramos uma conta com estes dados.',
  user_banned: 'Esta conta está bloqueada. Fale com o suporte.',
  session_not_found: 'Sua sessão expirou. Entre novamente.',
  session_expired: 'Sua sessão expirou. Entre novamente.',
  refresh_token_not_found: 'Sua sessão expirou. Entre novamente.',
  refresh_token_already_used: 'Sua sessão expirou. Entre novamente.',
  reauthentication_needed: 'Por segurança, saia e entre novamente antes de alterar a senha.',
  validation_failed: 'Confira os dados informados e tente novamente.',
};

const AUTH_MESSAGE_PATTERNS: [RegExp, string][] = [
  [/invalid login credentials/i, AUTH_MESSAGES.invalid_credentials],
  [/email not confirmed/i, AUTH_MESSAGES.email_not_confirmed],
  [/already (been )?registered|already exists/i, AUTH_MESSAGES.user_already_exists],
  [/token has expired or is invalid|otp.*(expired|invalid)/i, AUTH_MESSAGES.otp_expired],
  [/password should be|weak password/i, AUTH_MESSAGES.weak_password],
  [/should be different from the old password/i, AUTH_MESSAGES.same_password],
  [/rate limit|too many requests|for security purposes/i, AUTH_MESSAGES.over_request_rate_limit],
];

type ErrorLike = {
  name?: unknown;
  message?: unknown;
  code?: unknown;
  status?: unknown;
  statusCode?: unknown;
  details?: unknown;
  __isAuthError?: unknown;
};

function asErrorLike(error: unknown): ErrorLike | null {
  return typeof error === 'object' && error !== null ? (error as ErrorLike) : null;
}

const text = (value: unknown) => (typeof value === 'string' ? value : '');

export function isNetworkError(error: unknown): boolean {
  const err = asErrorLike(error);
  if (!err) return false;
  if (err.name === 'AuthRetryableFetchError' || err.name === 'StorageUnknownError') return true;
  return /network request failed|failed to fetch|networkerror|load failed|fetch failed|timed? ?out|aborted/i.test(
    text(err.message),
  );
}

function isAuthError(err: ErrorLike): boolean {
  return err.__isAuthError === true || text(err.name).startsWith('Auth');
}

function isPostgrestError(err: ErrorLike): boolean {
  return typeof err.code === 'string' && 'details' in err;
}

/**
 * Falha intermitente do Neon: a requisição chegou ao banco sem a sessão do JWT carregada.
 * O banco recusa antes de alterar qualquer coisa, então repetir é seguro (inclusive em ações).
 */
export function isSessionNotIdentified(error: unknown): boolean {
  return /sessão não identificada|não autenticada/i.test(text(asErrorLike(error)?.message));
}

/** Erros que valem nova tentativa automática (falhas de rede e indisponibilidade). */
export function isRetryableError(error: unknown): boolean {
  if (isNetworkError(error)) return true;
  const err = asErrorLike(error);
  // Raramente, o Neon executa uma requisição sem identificar a sessão do JWT; repetir resolve.
  if (isSessionNotIdentified(error)) return true;
  const status = Number(err?.status ?? err?.statusCode ?? 0);
  return status >= 500 || status === 408;
}

export function getErrorMessage(error: unknown, fallback = GENERIC_MESSAGE): string {
  if (!error) return fallback;
  if (error instanceof AppError) return error.message;
  if (isNetworkError(error)) return NETWORK_MESSAGE;

  const err = asErrorLike(error);
  if (!err) return fallback;
  const message = text(err.message);
  const code = text(err.code);

  if (isAuthError(err)) {
    if (code && AUTH_MESSAGES[code]) return AUTH_MESSAGES[code];
    const pattern = AUTH_MESSAGE_PATTERNS.find(([regex]) => regex.test(message));
    if (pattern) return pattern[1];
    if (Number(err.status) === 429) return AUTH_MESSAGES.over_request_rate_limit;
    return fallback;
  }

  if (isPostgrestError(err)) {
    switch (code) {
      case 'P0001':
        // Mensagens de regras de negócio do banco (já escritas em português).
        return message || fallback;
      case '23505':
        return 'Este registro já existe.';
      case '23514':
      case '22001':
      case '22P02':
        return 'Alguns dados estão em formato inválido. Revise e tente novamente.';
      case '42501':
        return 'Você não tem permissão para realizar esta ação.';
      case 'PGRST116':
        return 'Não encontramos o que você procurou.';
      case 'PGRST301':
      case 'PGRST303':
        return AUTH_MESSAGES.session_expired;
      default:
        return fallback;
    }
  }

  if (/payload too large|maximum allowed size|exceeded the maximum/i.test(message)) {
    return 'A imagem é grande demais. Escolha uma imagem menor que 5 MB.';
  }
  if (/mime type|invalid_mime_type|not supported/i.test(message)) {
    return 'Formato de imagem não suportado. Use JPG, PNG ou WEBP.';
  }
  return fallback;
}
