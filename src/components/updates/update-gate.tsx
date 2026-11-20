import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { useEffect, useRef } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDialog } from '@/components/feedback/dialog-provider';
import { useToast } from '@/components/feedback/toast-provider';
import { AppText } from '@/components/ui/app-text';
import { BrandMark } from '@/components/ui/brand-mark';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/constants/app';
import { DIALOG_ENTER } from '@/constants/motion';
import { colors, MAX_CONTENT_WIDTH, radius, spacing } from '@/constants/theme';
import { preferences } from '@/lib/secure-storage';
import {
  getLatestRelease,
  getUpdateStatus,
  installedVersion,
  updatePlatform,
  type AppRelease,
} from '@/services/updates.service';

export const updateKeys = { latest: ['app-release', updatePlatform ?? 'web'] as const };

/**
 * Checa a versão mais nova publicada (ao abrir o app e sempre que ele volta para a frente):
 * - obrigatória: tela cheia que não pode ser fechada até atualizar;
 * - opcional: aviso com "Atualizar" / "Agora não" (uma vez por versão).
 */
export function UpdateGate() {
  const { data: release } = useQuery({
    queryKey: updateKeys.latest,
    queryFn: getLatestRelease,
    enabled: updatePlatform !== null,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: 'always',
    refetchInterval: 30 * 60_000,
  });
  const status = getUpdateStatus(installedVersion, release ?? null);

  return (
    <>
      {status === 'available' && release ? <OptionalUpdatePrompt release={release} /> : null}
      <Modal
        visible={status === 'required'}
        animationType="fade"
        statusBarTranslucent
        // Atualização obrigatória: o botão "voltar" do Android não fecha.
        onRequestClose={() => undefined}
      >
        {status === 'required' && release ? <RequiredUpdateScreen release={release} /> : null}
      </Modal>
    </>
  );
}

function useOpenDownload(release: AppRelease) {
  const toast = useToast();
  return async () => {
    try {
      await Linking.openURL(release.download_url);
    } catch {
      toast.error('Não foi possível abrir o link da atualização. Tente novamente.');
    }
  };
}

function RequiredUpdateScreen({ release }: { release: AppRelease }) {
  const insets = useSafeAreaInsets();
  const download = useOpenDownload(release);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={DIALOG_ENTER} style={styles.hero}>
          <BrandMark size={72} />
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <AppText variant="caption" color={colors.primary}>
              Versão {release.version}
            </AppText>
          </View>
          <AppText variant="display" align="center" accessibilityRole="header">
            Atualize o {APP_NAME}
          </AppText>
          <AppText variant="body" color={colors.textSecondary} align="center">
            Uma nova versão está disponível e é necessária para continuar usando o app. Leva menos de um minuto.
          </AppText>
        </Animated.View>

        {release.release_notes ? (
          <View style={styles.notes}>
            <AppText variant="eyebrow" color={colors.accentText}>
              O que mudou
            </AppText>
            <AppText variant="body">{release.release_notes}</AppText>
          </View>
        ) : null}

        {Platform.OS === 'android' ? (
          <View style={styles.steps}>
            <Step number={1} text="Toque em “Baixar atualização”." />
            <Step number={2} text="Abra o arquivo baixado e toque em “Instalar”." />
            <Step number={3} text="Se o Android pedir, permita instalar apps desta fonte. Seus dados continuam salvos." />
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Baixar atualização" icon="download-outline" onPress={download} fullWidth />
        <AppText variant="caption" color={colors.textMuted} align="center">
          Versão instalada: {installedVersion}
        </AppText>
      </View>
    </View>
  );
}

function Step({ number, text }: { number: number; text: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNumber}>
        <AppText variant="smallStrong" color={colors.primary}>
          {number}
        </AppText>
      </View>
      <AppText variant="small" style={styles.flex}>
        {text}
      </AppText>
    </View>
  );
}

/** Atualização opcional: um aviso por versão; "Agora não" não pergunta de novo para a mesma versão. */
function OptionalUpdatePrompt({ release }: { release: AppRelease }) {
  const dialog = useDialog();
  const download = useOpenDownload(release);
  const asked = useRef<string | null>(null);

  useEffect(() => {
    if (asked.current === release.version) return;
    asked.current = release.version;
    const key = `update-dismissed-${release.version}`;
    void (async () => {
      if (await preferences.getFlag(key)) return;
      const confirmed = await dialog.confirm({
        title: 'Nova versão disponível',
        message: release.release_notes
          ? `A versão ${release.version} chegou: ${release.release_notes}`
          : `A versão ${release.version} chegou com melhorias para você.`,
        confirmLabel: 'Atualizar',
        cancelLabel: 'Agora não',
        icon: 'sparkles-outline',
      });
      if (confirmed) await download();
      else await preferences.setFlag(key, true);
    })();
  }, [release, dialog, download]);

  return null;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.xl,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  hero: {
    alignItems: 'center',
    gap: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  notes: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  steps: {
    gap: spacing.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  footer: {
    gap: spacing.sm,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingTop: spacing.md,
  },
  flex: {
    flex: 1,
  },
});
