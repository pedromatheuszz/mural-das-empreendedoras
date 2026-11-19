import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces/700Bold';
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { BrandSplash } from '@/components/brand-splash';
import { ConfigErrorScreen } from '@/components/config-error-screen';
import { DialogProvider } from '@/components/feedback/dialog-provider';
import { ToastProvider } from '@/components/feedback/toast-provider';
import { colors } from '@/constants/theme';
import { envProblem } from '@/lib/env';
import { queryClient } from '@/lib/query-client';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { OnboardingProvider, useOnboarding } from '@/providers/onboarding-provider';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export const unstable_settings = {
  anchor: 'index',
};

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.accent,
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
  const fontsReady = fontsLoaded || Boolean(fontError);

  return (
    <ThemeProvider value={navigationTheme}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <DialogProvider>
            <AuthProvider>
              <OnboardingProvider>
                <StatusBar style="dark" />
                {/* No Android, textos medidos antes das fontes carregarem ficam cortados:
                    só renderiza as telas com as fontes prontas (a splash nativa cobre a espera). */}
                {fontsReady ? envProblem ? <ConfigErrorScreen problem={envProblem} /> : <RootNavigator /> : null}
                {fontsReady ? <SplashGate fontsReady={fontsReady} /> : null}
              </OnboardingProvider>
            </AuthProvider>
          </DialogProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

function SplashGate({ fontsReady }: { fontsReady: boolean }) {
  const { isLoading } = useAuth();
  const { done } = useOnboarding();
  return <BrandSplash ready={fontsReady && !isLoading && done !== null} fontsReady={fontsReady} />;
}

/**
 * Rotas e proteção de acesso:
 * - sem sessão: onboarding, login, cadastro e recuperação de senha;
 * - com sessão: Mural (abas), perfis, cadastro empresarial e configurações;
 * - sempre disponíveis: redefinição de senha e documentos legais.
 * A proteção real dos dados é feita no banco (RLS); aqui controlamos a navegação.
 */
function RootNavigator() {
  const { isSignedIn, isLoading } = useAuth();
  // Enquanto a sessão salva é restaurada (atrás da splash), nenhuma rota é bloqueada:
  // assim um link direto para uma tela protegida não se perde no caminho.
  const showGuest = !isSignedIn || isLoading;
  const showApp = isSignedIn || isLoading;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ animation: 'none' }} />

      <Stack.Protected guard={showGuest}>
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      </Stack.Protected>

      <Stack.Protected guard={showApp}>
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="entrepreneur/[id]" />
        <Stack.Screen name="profile/create" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="profile/edit" />
        <Stack.Screen name="profile/preview" />
        <Stack.Screen name="settings/personal" />
        <Stack.Screen name="settings/password" />
        <Stack.Screen name="settings/delete-account" />
        <Stack.Screen name="report/[id]" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="admin/painel" />
        <Stack.Screen name="admin/profile/[id]" />
        <Stack.Screen name="admin/edit/[id]" />
        <Stack.Screen name="admin/roles" />
      </Stack.Protected>

      <Stack.Screen name="reset-password" />
      <Stack.Screen name="legal/terms" />
      <Stack.Screen name="legal/privacy" />
    </Stack>
  );
}
