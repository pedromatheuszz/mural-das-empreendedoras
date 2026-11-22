import Ionicons from '@expo/vector-icons/Ionicons';
import * as Linking from 'expo-linking';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { type CSSTransitionProperties } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '@/components/feedback/toast-provider';
import { AppText } from '@/components/ui/app-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { CSS_EASE_OUT, FADE_IN } from '@/constants/motion';
import { colors, fonts, MAX_CONTENT_WIDTH, radius, shadows, spacing } from '@/constants/theme';
import { useApkDownload } from '@/hooks/use-apk-download';
import {
  apkDownload,
  formatBytes,
  formatTimeLeft,
  progressPercent,
  type ApkDownloadState,
} from '@/services/apk-download.service';
import type { AppRelease } from '@/services/updates.service';

/** Elemento absoluto e sem filhos: animar a largura não refaz o layout de mais nada. */
const fillTransition: CSSTransitionProperties = {
  transitionProperty: 'width',
  transitionDuration: 250,
  transitionTimingFunction: CSS_EASE_OUT,
};

type PanelProps = {
  release: AppRelease;
  /** Atualização obrigatória: sem "Segundo plano". */
  mandatory?: boolean;
  onBackground?: () => void;
};

const TITLES: Record<ApkDownloadState['status'], string> = {
  idle: 'Baixando atualização',
  downloading: 'Baixando atualização',
  paused: 'Download pausado',
  done: 'Atualização pronta',
  error: 'Download interrompido',
};

/** Cartão de download do APK: porcentagem, barra, baixado, velocidade, tempo restante e ações. */
export function UpdateDownloadPanel({ release, mandatory, onBackground }: PanelProps) {
  const toast = useToast();
  const download = useApkDownload();
  const done = download.status === 'done';
  const percent = done ? 100 : progressPercent(download.bytesWritten, download.totalBytes);
  const total = download.totalBytes > 0 ? download.totalBytes : null;

  const install = async () => {
    try {
      await apkDownload.install();
    } catch {
      toast.error('Não foi possível abrir o instalador. Tente novamente.');
    }
  };

  const openInBrowser = async () => {
    try {
      await Linking.openURL(release.download_url);
    } catch {
      toast.error('Não foi possível abrir o link da atualização.');
    }
  };

  return (
    <Animated.View entering={FADE_IN} style={styles.card}>
      <View style={styles.header}>
        <AppText variant="heading" color={colors.text} accessibilityRole="header">
          {TITLES[download.status]}
        </AppText>
        <AppText variant="bodyStrong" color={colors.accentText}>
          Versão {release.version}
        </AppText>
      </View>

      <View
        style={styles.percentRow}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Progresso do download"
        accessibilityValue={{ min: 0, max: 100, now: percent }}
      >
        <AppText style={styles.percent} color={colors.text}>
          {percent}
        </AppText>
        <AppText style={styles.percentSign} color={colors.textSecondary}>
          %
        </AppText>
      </View>

      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillTransition, { width: `${percent}%` }]} />
      </View>

      {download.status === 'error' ? (
        <AppText variant="small" color={colors.danger}>
          {download.error}
        </AppText>
      ) : (
        <View style={styles.stats}>
          <Stat
            label="Baixado"
            value={formatBytes(download.bytesWritten)}
            detail={total ? `/ ${formatBytes(total)}` : undefined}
          />
          <Stat
            label="Velocidade"
            value={download.status === 'downloading' && download.speed > 0 ? `${formatBytes(download.speed)}/s` : '--'}
          />
          <Stat
            label="Tempo restante"
            value={
              done
                ? 'Pronto'
                : download.status === 'downloading'
                  ? formatTimeLeft(download.bytesWritten, download.totalBytes, download.speed)
                  : '--'
            }
          />
        </View>
      )}

      <AppText variant="small" color={colors.textSecondary}>
        {done
          ? 'Toque em “Instalar atualização” e confirme no Android. Sua conta e seu perfil continuam salvos. Se o Android pedir, permita instalar apps do Mural e toque em Instalar de novo.'
          : mandatory
            ? 'Você pode pausar e continuar depois; a parte já baixada fica guardada. Wi-Fi recomendado.'
            : 'Você pode pausar ou continuar usando o app enquanto baixa; a parte já baixada fica guardada. Wi-Fi recomendado.'}
      </AppText>

      <View style={styles.actions}>
        {done ? (
          <PanelButton title="Instalar atualização" icon="download-outline" tone="primary" onPress={install} grow />
        ) : download.status === 'error' ? (
          <>
            <PanelButton
              title="Tentar novamente"
              icon="refresh"
              tone="primary"
              onPress={() => apkDownload.retry(release)}
              grow
            />
            <PanelButton title="Pelo navegador" tone="neutral" onPress={openInBrowser} />
          </>
        ) : (
          <>
            {!mandatory && onBackground ? (
              <PanelButton title="Segundo plano" tone="neutral" onPress={onBackground} />
            ) : null}
            {download.status === 'paused' ? (
              <PanelButton title="Continuar" icon="play" tone="primary" onPress={() => apkDownload.resume()} />
            ) : (
              <PanelButton title="Pausar" icon="pause" tone="danger" onPress={() => apkDownload.pause()} />
            )}
          </>
        )}
      </View>
    </Animated.View>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
        {label}
      </AppText>
      <AppText variant="subtitle" color={colors.text} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      {detail ? (
        <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
          {detail}
        </AppText>
      ) : null}
    </View>
  );
}

type Tone = 'primary' | 'neutral' | 'danger';

function PanelButton({
  title,
  icon,
  tone,
  onPress,
  grow,
}: {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone: Tone;
  onPress: () => void;
  grow?: boolean;
}) {
  const textColor = tone === 'primary' ? colors.onPrimary : tone === 'danger' ? colors.danger : colors.text;
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.button, styles[`button_${tone}`], grow && styles.grow]}
      pressedStyle={styles.buttonPressed}
    >
      {icon ? <Ionicons name={icon} size={18} color={textColor} /> : null}
      <AppText variant="button" color={textColor}>
        {title}
      </AppText>
    </PressableScale>
  );
}

/** Folha inferior com o painel (atualização opcional). "Segundo plano" fecha e o download continua. */
export function UpdateDownloadSheet({
  release,
  visible,
  onClose,
}: {
  release: AppRelease;
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Continuar em segundo plano" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <UpdateDownloadPanel release={release} onBackground={onClose} />
        </View>
      </View>
    </Modal>
  );
}

/** Indicador flutuante enquanto o download roda em segundo plano. Toque para abrir o painel. */
export function UpdateDownloadPill({ onPress }: { onPress: () => void }) {
  const insets = useSafeAreaInsets();
  const download = useApkDownload();
  if (download.status === 'idle' || download.status === 'error') return null;
  const done = download.status === 'done';
  const percent = done ? 100 : progressPercent(download.bytesWritten, download.totalBytes);
  const label = done
    ? 'Atualização pronta · Instalar'
    : `${download.status === 'paused' ? 'Atualização pausada' : 'Baixando atualização'} · ${percent}%`;
  return (
    <View pointerEvents="box-none" style={[styles.pillHost, { top: insets.top + spacing.xs }]}>
      <Animated.View entering={FADE_IN}>
        <PressableScale
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`${label}. Toque para ver o download`}
          style={styles.pill}
        >
          <Ionicons
            name={done ? 'checkmark-circle' : download.status === 'paused' ? 'pause' : 'cloud-download-outline'}
            size={16}
            color={colors.primary}
          />
          <AppText variant="smallStrong" color={colors.text}>
            {label}
          </AppText>
          <View style={styles.pillTrack}>
            <Animated.View style={[styles.fill, fillTransition, { width: `${percent}%` }]} />
          </View>
        </PressableScale>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.xxl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.raised,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  header: {
    gap: spacing.xxs,
  },
  percentRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xxs,
  },
  percent: {
    fontFamily: fonts.bold,
    fontSize: 64,
    lineHeight: 70,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  percentSign: {
    fontFamily: fonts.semibold,
    fontSize: 24,
    lineHeight: 34,
  },
  track: {
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSunken,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  stat: {
    flex: 1,
    gap: 2,
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  button: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  button_primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  button_neutral: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  button_danger: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerSoft,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  grow: {
    flexGrow: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.scrim,
  },
  sheet: {
    paddingHorizontal: spacing.md,
  },
  pillHost: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.floating,
  },
  pillTrack: {
    width: 48,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSunken,
    overflow: 'hidden',
  },
});
