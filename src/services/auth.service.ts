import { LEGAL_VERSION } from '@/constants/app';
import { db } from '@/lib/data-api';
import { AuthError, neonAuth } from '@/lib/neon-auth';
import { AppError } from '@/utils/errors';
import { sanitizeLine } from '@/utils/sanitize';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

/**
 * Garante a linha da conta em public.users (o Neon Auth não dispara triggers no banco).
 * Chamada após cada login; no cadastro, registra também o aceite dos Termos.
 */
async function ensureAccount(termsVersion?: string): Promise<void> {
  const { error } = await db.rpc('ensure_my_account', { p_terms_version: termsVersion ?? null });
  if (error) throw error;
}

/** Aceite dos Termos feito no cadastro, aguardando a confirmação do e-mail. */
let pendingTermsVersion: string | null = null;

export async function signIn(params: { email: string; password: string }): Promise<void> {
  await neonAuth.signInWithPassword(normalizeEmail(params.email), params.password);
  await ensureAccount(pendingTermsVersion ?? undefined);
  pendingTermsVersion = null;
}

export async function signUp(params: {
  fullName: string;
  email: string;
  password: string;
}): Promise<{ needsEmailConfirmation: boolean }> {
  // Só é possível criar conta marcando o aceite dos Termos na tela de cadastro.
  pendingTermsVersion = LEGAL_VERSION;
  const { session } = await neonAuth.signUp({
    email: normalizeEmail(params.email),
    password: params.password,
    name: sanitizeLine(params.fullName),
  });
  if (session) {
    await ensureAccount(LEGAL_VERSION);
    pendingTermsVersion = null;
  }
  return { needsEmailConfirmation: !session };
}

export async function verifySignUpCode(email: string, code: string): Promise<void> {
  const session = await neonAuth.verifyEmail(normalizeEmail(email), code.trim());
  if (!session) {
    throw new AppError('E-mail confirmado! Agora entre com seu e-mail e senha.', 'email_verified_sign_in');
  }
  await ensureAccount(pendingTermsVersion ?? LEGAL_VERSION);
  pendingTermsVersion = null;
}

export async function resendSignUpCode(email: string): Promise<void> {
  await neonAuth.sendVerificationCode(normalizeEmail(email), 'email-verification');
}

export async function requestPasswordReset(email: string): Promise<void> {
  await neonAuth.sendVerificationCode(normalizeEmail(email), 'forget-password');
}

/** Código de recuperação já validado, usado ao definir a nova senha. */
let pendingRecovery: { email: string; code: string } | null = null;

export async function verifyRecoveryCode(email: string, code: string): Promise<void> {
  const normalized = normalizeEmail(email);
  await neonAuth.checkVerificationCode(normalized, code.trim(), 'forget-password');
  pendingRecovery = { email: normalized, code: code.trim() };
}

/** Define a nova senha com o código de recuperação e já entra na conta. */
export async function updatePassword(password: string): Promise<void> {
  if (!pendingRecovery) {
    throw new AppError('Peça um novo código de recuperação para criar a nova senha.', 'recovery_missing');
  }
  const { email, code } = pendingRecovery;
  await neonAuth.resetPassword(email, code, password);
  pendingRecovery = null;
  await signIn({ email, password });
}

/** Confirma a senha atual antes de definir a nova (evita troca por quem pegou o celular desbloqueado). */
export async function changePassword(params: { currentPassword: string; newPassword: string }) {
  try {
    await neonAuth.changePassword(params.currentPassword, params.newPassword);
  } catch (error) {
    if (error instanceof AuthError && error.code === 'invalid_password') {
      throw new AppError('A senha atual está incorreta.', 'invalid_current_password');
    }
    throw error;
  }
}

export async function signOut(): Promise<void> {
  await neonAuth.signOut();
}
