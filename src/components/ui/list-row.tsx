import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';

import { AppText } from './app-text';
import { PressableScale } from './pressable-scale';

type ListRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
  destructive?: boolean;
  accessibilityHint?: string;
};

/** Linha de menu (Meu Perfil, Configurações). */
export function ListRow({ icon, title, subtitle, onPress, right, destructive, accessibilityHint }: ListRowProps) {
  const tint = destructive ? colors.danger : colors.primary;
  return (
    <PressableScale
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      accessibilityHint={accessibilityHint}
      scaleTo={1}
      style={styles.row}
      pressedStyle={styles.pressed}
    >
      <View style={[styles.iconWrap, destructive ? styles.iconDanger : null]}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <View style={styles.texts}>
        <AppText variant="bodyStrong" color={destructive ? colors.danger : colors.text}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="small" color={colors.textSecondary} numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null)}
    </PressableScale>
  );
}

/** Grupo de linhas em um cartão. */
export function ListGroup({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <View style={styles.groupWrap}>
      {title ? (
        <AppText variant="eyebrow" color={colors.textMuted} style={styles.groupTitle} accessibilityRole="header">
          {title}
        </AppText>
      ) : null}
      <View style={styles.group}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 60,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDanger: {
    backgroundColor: colors.dangerSoft,
  },
  texts: {
    flex: 1,
    gap: 1,
  },
  groupWrap: {
    gap: spacing.xs,
  },
  groupTitle: {
    marginLeft: spacing.xs,
  },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
});
