/**
 * Login de desenvolvedor: atalho na tela de login que entra com a conta definida em
 * EXPO_PUBLIC_DEV_LOGIN_EMAIL / EXPO_PUBLIC_DEV_LOGIN_PASSWORD (arquivo .env local).
 *
 * Só existe em modo de desenvolvimento (__DEV__): no build de produção este código é
 * removido. Nunca cadastre essas variáveis nos ambientes "preview"/"production" do EAS.
 */
export function getDevLogin(): { email: string; password: string } | null {
  if (!__DEV__) return null;
  const email = process.env.EXPO_PUBLIC_DEV_LOGIN_EMAIL?.trim();
  const password = process.env.EXPO_PUBLIC_DEV_LOGIN_PASSWORD;
  return email && password ? { email, password } : null;
}
