import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { colors, radius, shadows, spacing } from '@/constants/theme';

import { AppText } from './app-text';

/** Cartão branco com borda suave. */
export function Card({ children, style, padded = true }: { children: ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  return <View style={[styles.card, padded ? styles.cardPadded : null, style]}>{children}</View>;
}

type SectionHeaderProps = {
  title: string;
  eyebrow?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, eyebrow, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTexts}>
        {eyebrow ? (
          <AppText variant="eyebrow" color={colors.accentText}>
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant="heading" accessibilityRole="header">
          {title}
        </AppText>
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button" accessibilityLabel={actionLabel}>
          <AppText variant="smallStrong" color={colors.accentText}>
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ProgressBar({ progress, label }: { progress: number; label: string }) {
  const clamped = Math.max(0, Math.min(1, progress));
  const fillStyle = useAnimatedStyle(() => ({ width: withTiming(`${clamped * 100}%`, { duration: 320 }) }));
  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardPadded: {
    padding: spacing.lg,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionTexts: {
    flex: 1,
    gap: 2,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceSunken,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
});
