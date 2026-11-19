import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/constants/theme';
import type { EnvProblem } from '@/lib/env';

import { AppText } from './ui/app-text';

/** Exibida quando as variáveis do Neon não foram configuradas (ambiente de desenvolvimento). */
export function ConfigErrorScreen({ problem }: { problem: Exclude<EnvProblem, null> }) {
  const insets = useSafeAreaInsets();
  const secret = problem === 'secret-key';
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xl }]}
    >
      <View style={styles.icon}>
        <Ionicons name={secret ? 'warning-outline' : 'construct-outline'} size={30} color={colors.primary} />
      </View>
      <AppText variant="title">{secret ? 'Segredo detectado' : 'Configure o Neon'}</AppText>
      {secret ? (
        <AppText variant="body" color={colors.textSecondary}>
          Uma variável EXPO_PUBLIC_ contém um segredo (string de conexão do banco ou chave de API). Segredos ignoram as
          regras de segurança e nunca podem ser embutidos no aplicativo. Use apenas os endereços públicos do Neon.
        </AppText>
      ) : (
        <AppText variant="body" color={colors.textSecondary}>
          O aplicativo precisa dos endereços públicos do Neon Auth e da Data API do seu projeto para funcionar.
        </AppText>
      )}
      <View style={styles.steps}>
        {[
          'Copie o arquivo .env.example para .env na raiz do projeto.',
          'Preencha EXPO_PUBLIC_NEON_AUTH_URL e EXPO_PUBLIC_NEON_DATA_API_URL (Neon Console → Auth e Data API).',
          'Reinicie o servidor com: npx expo start --clear',
        ].map((step, index) => (
          <View key={step} style={styles.step}>
            <AppText variant="smallStrong" color={colors.primary}>
              {index + 1}.
            </AppText>
            <AppText variant="small" style={styles.flex}>
              {step}
            </AppText>
          </View>
        ))}
      </View>
      <AppText variant="caption" color={colors.textMuted}>
        Passo a passo completo em docs/NEON.md.
      </AppText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  icon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  steps: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  step: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  flex: {
    flex: 1,
  },
});
