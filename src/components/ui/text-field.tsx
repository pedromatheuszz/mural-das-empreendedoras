import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ComponentRef, type Ref } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts, radius, spacing } from '@/constants/theme';

import { AppText } from './app-text';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  helper?: string;
  error?: string;
  optional?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  showCounter?: boolean;
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

export function TextField({
  label,
  helper,
  error,
  optional,
  leftIcon,
  showCounter,
  secureTextEntry,
  multiline,
  value,
  maxLength,
  editable = true,
  onFocus,
  onBlur,
  ref,
  ...rest
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.borderStrong;
  const length = value?.length ?? 0;
  const nearLimit = maxLength ? length > maxLength * 0.9 : false;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <AppText variant="smallStrong" style={styles.label}>
          {label}
          {optional ? (
            <AppText variant="small" color={colors.textMuted}>
              {' '}
              (opcional)
            </AppText>
          ) : null}
        </AppText>
        {showCounter && maxLength ? (
          <AppText
            variant="caption"
            color={nearLimit ? colors.accentText : colors.textMuted}
            accessibilityLabel={`${length} de ${maxLength} caracteres`}
          >
            {length}/{maxLength}
          </AppText>
        ) : null}
      </View>
      {helper ? (
        <AppText variant="caption" color={colors.textSecondary} style={styles.helper}>
          {helper}
        </AppText>
      ) : null}
      <View
        style={[
          styles.inputWrap,
          { borderColor },
          focused ? styles.inputFocused : null,
          multiline ? styles.multilineWrap : null,
          !editable ? styles.readOnly : null,
        ]}
      >
        {leftIcon ? (
          <Ionicons name={leftIcon} size={20} color={focused ? colors.primary : colors.textMuted} style={styles.leftIcon} />
        ) : null}
        <TextInput
          ref={ref}
          value={value}
          maxLength={maxLength}
          editable={editable}
          multiline={multiline}
          secureTextEntry={Boolean(secureTextEntry) && hidden}
          textAlignVertical={multiline ? 'top' : 'center'}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.accent}
          cursorColor={colors.primary}
          maxFontSizeMultiplier={1.5}
          accessibilityLabel={label}
          accessibilityHint={error ?? helper}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[styles.input, multiline ? styles.multiline : null, webNoOutline]}
          {...rest}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setHidden((current) => !current)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar senha' : 'Ocultar senha'}
            style={styles.trailing}
          >
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View style={styles.errorRow} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle" size={14} color={colors.danger} />
          <AppText variant="caption" color={colors.danger} style={styles.errorText}>
            {error}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const webNoOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null;

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  label: {
    flexShrink: 1,
  },
  helper: {
    marginTop: -2,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderWidth: 1.5,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  inputFocused: {
    backgroundColor: '#FFFDFC',
  },
  multilineWrap: {
    alignItems: 'flex-start',
    minHeight: 140,
    paddingVertical: spacing.sm,
  },
  readOnly: {
    backgroundColor: colors.surfaceMuted,
  },
  leftIcon: {
    marginRight: spacing.xs,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
    paddingVertical: Platform.select({ ios: 14, default: 10 }),
  },
  multiline: {
    minHeight: 112,
    paddingVertical: 0,
    lineHeight: 23,
  },
  trailing: {
    marginLeft: spacing.xs,
    padding: 4,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  errorText: {
    flex: 1,
  },
});
