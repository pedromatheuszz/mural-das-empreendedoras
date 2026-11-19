import { z } from 'zod';

import { LIMITS } from '@/constants/app';

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail.')
  .max(254, 'E-mail muito longo.')
  .pipe(z.email('Informe um e-mail válido, como nome@exemplo.com.'));

export const passwordSchema = z
  .string()
  .min(LIMITS.password.min, `A senha precisa ter pelo menos ${LIMITS.password.min} caracteres.`)
  .max(LIMITS.password.max, `A senha pode ter no máximo ${LIMITS.password.max} caracteres.`)
  .regex(/\p{L}/u, 'Inclua pelo menos uma letra.')
  .regex(/\d/, 'Inclua pelo menos um número.');

export const fullNameSchema = z
  .string()
  .trim()
  .min(LIMITS.fullName.min, 'Informe seu nome completo.')
  .max(LIMITS.fullName.max, `Use no máximo ${LIMITS.fullName.max} caracteres.`)
  .refine((value) => /\p{L}/u.test(value) && !/[<>{}[\]\\|@#$%^*=+~`]/.test(value), 'Use apenas letras no nome.')
  .refine((value) => value.split(/\s+/).filter(Boolean).length >= 2, 'Informe nome e sobrenome.');

export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6,10}$/, 'Digite o código numérico enviado para o seu e-mail.');

const matchPasswords = {
  error: 'As senhas não coincidem.',
  path: ['confirmPassword'],
  when: () => true,
};

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe sua senha.'),
});

export const signUpSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme sua senha.'),
    acceptTerms: z.boolean().refine((value) => value, 'Para continuar, aceite os Termos de Uso e a Política de Privacidade.'),
    confirmAge: z.boolean().refine((value) => value, 'O Mural é destinado a pessoas com 18 anos ou mais.'),
  })
  .refine((data) => data.password === data.confirmPassword, matchPasswords);

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const verifyCodeSchema = z.object({
  code: otpCodeSchema,
});

export const newPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme sua nova senha.'),
  })
  .refine((data) => data.password === data.confirmPassword, matchPasswords);

export const resetWithCodeSchema = z
  .object({
    code: otpCodeSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme sua nova senha.'),
  })
  .refine((data) => data.password === data.confirmPassword, matchPasswords);

/** Nova senha após abrir o link do e-mail (sessão de recuperação já criada; sem código). */
export const resetWithLinkSchema = z
  .object({
    code: z.string(),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme sua nova senha.'),
  })
  .refine((data) => data.password === data.confirmPassword, matchPasswords);

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe sua senha atual.'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme sua nova senha.'),
  })
  .refine((data) => data.password === data.confirmPassword, matchPasswords)
  .refine((data) => data.password !== data.currentPassword, {
    error: 'A nova senha precisa ser diferente da atual.',
    path: ['password'],
  });

export const personalDataSchema = z.object({
  fullName: fullNameSchema,
});

export const changeEmailSchema = z.object({
  email: emailSchema,
});

export const DELETE_CONFIRMATION_WORD = 'EXCLUIR';

export const deleteAccountSchema = z.object({
  confirmation: z
    .string()
    .trim()
    .refine((value) => value.toUpperCase() === DELETE_CONFIRMATION_WORD, `Digite ${DELETE_CONFIRMATION_WORD} para confirmar.`),
});

export type SignInValues = z.input<typeof signInSchema>;
export type SignUpValues = z.input<typeof signUpSchema>;
export type ForgotPasswordValues = z.input<typeof forgotPasswordSchema>;
export type VerifyCodeValues = z.input<typeof verifyCodeSchema>;
export type NewPasswordValues = z.input<typeof newPasswordSchema>;
export type ResetWithCodeValues = z.input<typeof resetWithCodeSchema>;
export type ChangePasswordValues = z.input<typeof changePasswordSchema>;
export type PersonalDataValues = z.input<typeof personalDataSchema>;
export type ChangeEmailValues = z.input<typeof changeEmailSchema>;
export type DeleteAccountValues = z.input<typeof deleteAccountSchema>;

/** Requisitos exibidos ao lado do campo de senha. */
export const PASSWORD_RULES = [
  { label: 'Pelo menos 8 caracteres', test: (value: string) => value.length >= LIMITS.password.min },
  { label: 'Uma letra', test: (value: string) => /\p{L}/u.test(value) },
  { label: 'Um número', test: (value: string) => /\d/.test(value) },
] as const;
