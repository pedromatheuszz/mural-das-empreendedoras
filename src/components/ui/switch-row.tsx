import { Platform, Pressable, StyleSheet, Switch, View } from 'react-native';

import { colors, palette, spacing } from '@/constants/theme';

import { AppText } from './app-text';

type SwitchRowProps = {
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

export function SwitchRow({ title, description, value, onValueChange, disabled }: SwitchRowProps) {
  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: !!disabled }}
      accessibilityLabel={title}
      accessibilityHint={description}
      style={[styles.row, disabled ? styles.disabled : null]}
    >
      <View style={styles.texts}>
        <AppText variant="bodyStrong">{title}</AppText>
        {description ? (
          <AppText variant="small" color={colors.textSecondary}>
            {description}
          </AppText>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: palette.beige300, true: colors.accent }}
        thumbColor={palette.white}
        ios_backgroundColor={palette.beige300}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        {...(Platform.OS === 'web' ? ({ activeThumbColor: palette.white } as object) : null)}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});
