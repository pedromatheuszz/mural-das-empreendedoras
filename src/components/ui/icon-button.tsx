import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors, palette, shadows } from '@/constants/theme';

type Variant = 'surface' | 'ghost' | 'glass' | 'primary' | 'soft';

const VARIANTS: Record<Variant, { background: string; pressed: string; icon: string; border: string }> = {
  surface: { background: colors.surface, pressed: colors.surfaceMuted, icon: colors.text, border: colors.border },
  ghost: { background: 'transparent', pressed: colors.surfaceMuted, icon: colors.text, border: 'transparent' },
  glass: { background: 'rgba(255,255,255,0.92)', pressed: palette.white, icon: colors.text, border: 'transparent' },
  primary: { background: colors.primary, pressed: colors.primaryPressed, icon: colors.onPrimary, border: colors.primary },
  soft: { background: colors.accentSoft, pressed: palette.lilac300, icon: colors.primary, border: colors.accentSoft },
};

type IconButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
  onPress?: () => void;
  variant?: Variant;
  size?: number;
  iconSize?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  testID?: string;
};

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  variant = 'surface',
  size = 44,
  iconSize = 22,
  disabled,
  style,
  accessibilityHint,
  testID,
}: IconButtonProps) {
  const tone = VARIANTS[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: pressed ? tone.pressed : tone.background,
          borderColor: tone.border,
        },
        variant === 'glass' ? shadows.card : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <Ionicons name={icon} size={iconSize} color={tone.icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.4,
  },
});
