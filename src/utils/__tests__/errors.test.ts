import { AppError, getErrorMessage, isNetworkError, isRetryableError, NETWORK_MESSAGE } from '../errors';

const authError = (code: string, message = '', status = 400) => ({ __isAuthError: true, name: 'AuthApiError', code, message, status });

describe('getErrorMessage', () => {
  it('traduz erros de autenticação', () => {
    expect(getErrorMessage(authError('invalid_credentials'))).toBe('E-mail ou senha incorretos.');
    expect(getErrorMessage(authError('', 'Email not confirmed'))).toMatch(/Confirme seu e-mail/);
    expect(getErrorMessage(authError('over_email_send_rate_limit', '', 429))).toMatch(/Aguarde alguns minutos/);
    expect(getErrorMessage(authError('', 'Token has expired or is invalid'))).toMatch(/Código inválido ou expirado/);
  });

  it('identifica falhas de conexão', () => {
    const offline = new TypeError('Network request failed');
    expect(isNetworkError(offline)).toBe(true);
    expect(getErrorMessage(offline)).toBe(NETWORK_MESSAGE);
    expect(isRetryableError(offline)).toBe(true);
  });

  it('traduz erros do banco (PostgREST)', () => {
    const pg = (code: string, message = '') => ({ code, message, details: null, hint: null });
    expect(getErrorMessage(pg('P0001', 'Somente a moderação do Mural pode suspender perfis.'))).toBe(
      'Somente a moderação do Mural pode suspender perfis.',
    );
    expect(getErrorMessage(pg('42501'))).toMatch(/permissão/);
    expect(getErrorMessage(pg('23514'))).toMatch(/formato inválido/);
    expect(isRetryableError(pg('42501'))).toBe(false);
    // Sessão não identificada pelo Neon numa requisição isolada: vale tentar de novo.
    expect(isRetryableError(pg('42501', 'Sessão não identificada. Tente novamente.'))).toBe(true);
    expect(isRetryableError(pg('42501', 'Não autenticada.'))).toBe(true);
  });

  it('usa a mensagem de AppError e um texto padrão para o resto', () => {
    expect(getErrorMessage(new AppError('Mensagem própria'))).toBe('Mensagem própria');
    expect(getErrorMessage({ foo: 'bar' })).toMatch(/Algo deu errado/);
    expect(getErrorMessage(undefined, 'Padrão')).toBe('Padrão');
  });

  it('considera 5xx como erro temporário', () => {
    expect(isRetryableError({ status: 503 })).toBe(true);
    expect(isRetryableError({ status: 400 })).toBe(false);
  });
});
