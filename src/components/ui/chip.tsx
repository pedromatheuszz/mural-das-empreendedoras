import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';

import { AppText } from './app-text';

type IconName = keyof typeof Ionicons.glyphMap;

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  size?: 'sm' | 'md';
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

/** Chip selecionável (filtros, categorias, cortesias). */
export function Chip({ label, selected = false, onPress, icon, size = 'md', accessibilityHint, style }: ChipProps) {
  const foreground = selected ? colors.onPrimary : colors.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      hitSlop={4}
      style={({ pressed }) => [
        styles.chip,
        size === 'sm' ? styles.chipSm : null,
        selected ? styles.selected : styles.unselected,
        pressed && !selected ? styles.pressed : null,
        style,
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={size === 'sm' ? 14 : 16} color={selected ? colors.onPrimary : colors.primary} />
      ) : null}
      <AppText variant="smallStrong" color={foreground} numberOfLines={1}>
        {label}
      </AppText>
      {selected && !icon ? <Ionicons name="checkmark" size={15} color={colors.onPrimary} /> : null}
    </Pressable>
  );
}

type PillProps = {
  label: string;
  icon?: IconName;
  background?: string;
  foreground?: string;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
};

/** Selo estático (categoria, localização, status). */
export function Pill({
  label,
  icon,
  background = colors.surfaceMuted,
  foreground = colors.textSecondary,
  size = 'sm',
  style,
}: PillProps) {
  return (
    <View
      style={[styles.pill, size === 'md' ? styles.pillMd : null, { backgroundColor: background }, style]}
      accessible
      accessibilityLabel={label}
    >
      {icon ? <Ionicons name={icon} size={size === 'md' ? 15 : 13} color={foreground} /> : null}
      <AppText variant={size === 'md' ? 'smallStrong' : 'caption'} color={foreground} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipSm: {
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    gap: 4,
  },
  unselected: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    maxWidth: '100%',
  },
  pillMd: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
});
