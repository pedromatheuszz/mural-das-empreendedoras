import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';

import { AppText } from './app-text';
import { PressableScale } from './pressable-scale';

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  accessibilityLabel: string;
  error?: string;
  disabled?: boolean;
};

export function Checkbox({ checked, onChange, label, accessibilityLabel, error, disabled }: CheckboxProps) {
  return (
    <View style={styles.container}>
      <PressableScale
        onPress={() => onChange(!checked)}
        disabled={disabled}
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled: !!disabled }}
        accessibilityLabel={accessibilityLabel}
        hitSlop={6}
        scaleTo={1}
      style={styles.row}
        pressedStyle={styles.pressed}
      >
        <View style={[styles.box, checked ? styles.boxChecked : null, error ? styles.boxError : null]}>
          {checked ? <Ionicons name="checkmark" size={16} color={colors.onPrimary} /> : null}
        </View>
        <View style={styles.label}>
          {typeof label === 'string' ? (
            <AppText variant="small" color={colors.textSecondary}>
              {label}
            </AppText>
          ) : (
            label
          )}
        </View>
      </PressableScale>
      {error ? (
        <AppText variant="caption" color={colors.danger} style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  pressed: {
    opacity: 0.8,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: radius.sm - 3,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  boxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  boxError: {
    borderColor: colors.danger,
  },
  label: {
    flex: 1,
  },
  error: {
    marginLeft: 36,
  },
});
