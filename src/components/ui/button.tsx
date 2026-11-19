import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { colors, palette, radius, spacing, typography } from '@/constants/theme';

import { AppText } from './app-text';

type Variant = 'primary' | 'soft' | 'secondary' | 'ghost' | 'danger' | 'dangerGhost' | 'inverse';
type Size = 'lg' | 'md' | 'sm';

const VARIANTS: Record<Variant, { background: string; pressed: string; text: string; border: string }> = {
  primary: { background: colors.primary, pressed: colors.primaryPressed, text: colors.onPrimary, border: colors.primary },
  soft: { background: colors.accentSoft, pressed: palette.rose300, text: colors.primary, border: colors.accentSoft },
  secondary: { background: colors.surface, pressed: colors.surfaceMuted, text: colors.primary, border: colors.borderStrong },
  ghost: { background: 'transparent', pressed: colors.primarySoft, text: colors.primary, border: 'transparent' },
  danger: { background: colors.danger, pressed: '#8E1D17', text: palette.white, border: colors.danger },
  dangerGhost: { background: 'transparent', pressed: colors.dangerSoft, text: colors.danger, border: 'transparent' },
  inverse: { background: palette.white, pressed: palette.rose50, text: colors.primary, border: palette.white },
};

const SIZES: Record<Size, { height: number; paddingHorizontal: number; icon: number; fontSize: number }> = {
  lg: { height: 54, paddingHorizontal: spacing.xl, icon: 20, fontSize: 16 },
  md: { height: 46, paddingHorizontal: spacing.lg, icon: 18, fontSize: 15 },
  sm: { height: 36, paddingHorizontal: spacing.md, icon: 16, fontSize: 13 },
};

const SPRING = { damping: 18, stiffness: 320, mass: 0.6 };

export type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const tone = VARIANTS[variant];
  const dimensions = SIZES[size];
  const inactive = disabled || loading;

  const iconElement = icon ? <Ionicons name={icon} size={dimensions.icon} color={tone.text} /> : null;

  return (
    <Animated.View style={[fullWidth ? styles.fullWidth : styles.auto, animatedStyle, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => scale.set(withSpring(0.97, SPRING))}
        onPressOut={() => scale.set(withSpring(1, SPRING))}
        disabled={inactive}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: inactive, busy: loading }}
        testID={testID}
        style={({ pressed }) => [
          styles.base,
          {
            minHeight: dimensions.height,
            paddingHorizontal: dimensions.paddingHorizontal,
            backgroundColor: pressed ? tone.pressed : tone.background,
            borderColor: tone.border,
          },
          disabled && !loading ? styles.disabled : null,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={tone.text} />
        ) : (
          <View style={styles.content}>
            {iconPosition === 'left' ? iconElement : null}
            <AppText
              style={[typography.button, { fontSize: dimensions.fontSize }]}
              color={tone.text}
              numberOfLines={1}
              maxFontSizeMultiplier={1.3}
            >
              {title}
            </AppText>
            {iconPosition === 'right' ? iconElement : null}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  auto: {
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  base: {
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  disabled: {
    opacity: 0.45,
  },
});
