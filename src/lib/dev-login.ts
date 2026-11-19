/**
 * Login de desenvolvedor: atalho na tela de login que entra com a conta definida em
 * EXPO_PUBLIC_DEV_LOGIN_EMAIL / EXPO_PUBLIC_DEV_LOGIN_PASSWORD (arquivo .env local).
 *
 * Só existe em modo de desenvolvimento (__DEV__) ou num APK DE TESTE gerado com
 * EXPO_PUBLIC_ENABLE_DEV_LOGIN=1 (a senha vai dentro do arquivo: nunca distribua esse APK).
 * Nunca cadastre essas variáveis nos ambientes "preview"/"production" do EAS.
 */
export function getDevLogin(): { email: string; password: string } | null {
  if (!__DEV__ && process.env.EXPO_PUBLIC_ENABLE_DEV_LOGIN !== '1') return null;
  const email = process.env.EXPO_PUBLIC_DEV_LOGIN_EMAIL?.trim();
  const password = process.env.EXPO_PUBLIC_DEV_LOGIN_PASSWORD;
  return email && password ? { email, password } : null;
}
