import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { colors, radius, spacing } from '@/constants/theme';
import { getErrorMessage, isNetworkError } from '@/utils/errors';
import { EASE_IN_OUT, FADE_IN } from '@/constants/motion';

import { AppText } from './app-text';
import { Button } from './button';

type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'brand' | 'danger';
  compact?: boolean;
};

/** Estado vazio com orientação (o que fazer a seguir). */
export function EmptyState({ icon, title, message, actionLabel, onAction, tone = 'brand', compact }: EmptyStateProps) {
  return (
    <Animated.View entering={FADE_IN} style={[styles.empty, compact ? styles.emptyCompact : null]} accessibilityRole="summary">
      <View style={[styles.iconCircle, tone === 'danger' ? styles.iconDanger : null]}>
        <Ionicons name={icon} size={30} color={tone === 'danger' ? colors.danger : colors.primary} />
      </View>
      <AppText variant="heading" align="center">
        {title}
      </AppText>
      {message ? (
        <AppText variant="body" color={colors.textSecondary} align="center" style={styles.message}>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} variant="secondary" size="md" style={styles.action} />
      ) : null}
    </Animated.View>
  );
}

/** Erro de carregamento com opção de tentar novamente (inclui falta de conexão). */
export function ErrorState({ error, onRetry, compact }: { error: unknown; onRetry?: () => void; compact?: boolean }) {
  const offline = isNetworkError(error);
  return (
    <EmptyState
      icon={offline ? 'cloud-offline-outline' : 'alert-circle-outline'}
      title={offline ? 'Sem conexão' : 'Não foi possível carregar'}
      message={getErrorMessage(error)}
      actionLabel={onRetry ? 'Tentar novamente' : undefined}
      onAction={onRetry}
      tone="danger"
      compact={compact}
    />
  );
}

/** Bloco de carregamento com pulsação suave. */
export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = radius.sm,
  style,
}: {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useSharedValue(0.55);
  useEffect(() => {
    opacity.set(withRepeat(withTiming(1, { duration: 900, easing: EASE_IN_OUT }), -1, true));
  }, [opacity]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width, height, borderRadius, backgroundColor: colors.surfaceSunken }, animatedStyle, style]}
    />
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyCompact: {
    paddingVertical: spacing.xl,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    marginBottom: spacing.xs,
  },
  iconDanger: {
    backgroundColor: colors.dangerSoft,
  },
  message: {
    maxWidth: 360,
  },
  action: {
    alignSelf: 'center',
    marginTop: spacing.xs,
  },
});
