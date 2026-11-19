import { AuthError } from '@/lib/neon-auth';
import { AppError } from '@/utils/errors';

import { changePassword, signIn, signUp, updatePassword, verifyRecoveryCode, verifySignUpCode } from '../auth.service';

const mockNeon = {
  signInWithPassword: jest.fn(),
  signUp: jest.fn(),
  verifyEmail: jest.fn(),
  checkVerificationCode: jest.fn(),
  resetPassword: jest.fn(),
  changePassword: jest.fn(),
};
const mockRpc = jest.fn();

jest.mock('@/lib/neon-auth', () => {
  const actual = jest.requireActual('@/lib/neon-auth');
  return {
    AuthError: actual.AuthError,
    get neonAuth() {
      return mockNeon;
    },
  };
});
jest.mock('@/lib/data-api', () => ({
  db: { rpc: (...args: unknown[]) => mockRpc(...args) },
}));

const SESSION = { user: { id: 'u1', email: 'ana@exemplo.com', name: 'Ana', emailVerified: true }, expiresAt: '' };

beforeEach(() => {
  jest.clearAllMocks();
  mockRpc.mockResolvedValue({ data: null, error: null });
});

describe('login e cadastro', () => {
  it('normaliza o e-mail no login e garante a conta no banco', async () => {
    mockNeon.signInWithPassword.mockResolvedValue(SESSION);
    await signIn({ email: '  Ana@Exemplo.COM ', password: 'segura123' });
    expect(mockNeon.signInWithPassword).toHaveBeenCalledWith('ana@exemplo.com', 'segura123');
    expect(mockRpc).toHaveBeenCalledWith('ensure_my_account', { p_terms_version: null });
  });

  it('cadastra com nome limpo e pede confirmação do e-mail', async () => {
    mockNeon.signUp.mockResolvedValue({ session: null });
    const result = await signUp({ fullName: '  Ana   Souza ', email: 'Ana@exemplo.com', password: 'segura123' });
    expect(result).toEqual({ needsEmailConfirmation: true });
    expect(mockNeon.signUp).toHaveBeenCalledWith({ email: 'ana@exemplo.com', password: 'segura123', name: 'Ana Souza' });
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('registra o aceite dos termos quando o código do e-mail é confirmado', async () => {
    mockNeon.signUp.mockResolvedValue({ session: null });
    mockNeon.verifyEmail.mockResolvedValue(SESSION);
    await signUp({ fullName: 'Ana Souza', email: 'ana@exemplo.com', password: 'segura123' });
    await verifySignUpCode(' ana@exemplo.com ', ' 123456 ');
    expect(mockNeon.verifyEmail).toHaveBeenCalledWith('ana@exemplo.com', '123456');
    expect(mockRpc).toHaveBeenCalledWith('ensure_my_account', { p_terms_version: expect.any(String) });
  });

  it('propaga erros do banco ao garantir a conta', async () => {
    mockNeon.signInWithPassword.mockResolvedValue(SESSION);
    mockRpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'x', details: null } });
    await expect(signIn({ email: 'ana@exemplo.com', password: 'segura123' })).rejects.toMatchObject({ code: '42501' });
  });
});

describe('senhas', () => {
  it('recupera a senha com o código e já entra na conta', async () => {
    mockNeon.checkVerificationCode.mockResolvedValue({});
    mockNeon.resetPassword.mockResolvedValue({});
    mockNeon.signInWithPassword.mockResolvedValue(SESSION);
    await verifyRecoveryCode('Ana@exemplo.com', '654321');
    await updatePassword('NovaSenha123');
    expect(mockNeon.resetPassword).toHaveBeenCalledWith('ana@exemplo.com', '654321', 'NovaSenha123');
    expect(mockNeon.signInWithPassword).toHaveBeenCalledWith('ana@exemplo.com', 'NovaSenha123');
  });

  it('não troca a senha sem um código de recuperação validado', async () => {
    await expect(updatePassword('NovaSenha123')).rejects.toBeInstanceOf(AppError);
    expect(mockNeon.resetPassword).not.toHaveBeenCalled();
  });

  it('explica quando a senha atual está incorreta', async () => {
    mockNeon.changePassword.mockRejectedValue(new AuthError('Invalid password', 'invalid_password', 400));
    await expect(changePassword({ currentPassword: 'errada123', newPassword: 'NovaSenha123' })).rejects.toThrow(
      'A senha atual está incorreta.',
    );
  });
});
