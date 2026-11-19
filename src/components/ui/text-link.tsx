import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/constants/theme';

import { AppText } from './app-text';

type TextLinkProps = {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

export function TextLink({ label, onPress, style, accessibilityHint }: TextLinkProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="link"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.link, pressed ? styles.pressed : null, style]}
    >
      <AppText variant="smallStrong" color={colors.accentText}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    paddingVertical: 4,
  },
  pressed: {
    opacity: 0.6,
  },
});
