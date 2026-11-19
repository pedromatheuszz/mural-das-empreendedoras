import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/constants/theme';

import { AppText } from './app-text';
import { PressableScale } from './pressable-scale';

type TextLinkProps = {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

export function TextLink({ label, onPress, style, accessibilityHint }: TextLinkProps) {
  return (
    <PressableScale
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="link"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      scaleTo={1}
      style={[styles.link, style]}
      pressedStyle={styles.pressed}
    >
      <AppText variant="smallStrong" color={colors.accentText}>
        {label}
      </AppText>
    </PressableScale>
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
