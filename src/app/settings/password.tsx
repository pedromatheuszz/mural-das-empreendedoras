import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm, useFormState, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { PasswordRules } from '@/components/auth/password-rules';
import { useToast } from '@/components/feedback/toast-provider';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { FormTextField } from '@/components/ui/form-fields';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { LIMITS } from '@/constants/app';
import { colors, spacing } from '@/constants/theme';
import { changePasswordSchema, type ChangePasswordValues } from '@/schemas/auth.schema';
import { changePassword } from '@/services/auth.service';
import { getErrorMessage } from '@/utils/errors';

export default function ChangePasswordScreen() {
  const toast = useToast();
  const { control, handleSubmit, setFocus } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', password: '', confirmPassword: '' },
    mode: 'onTouched',
  });
  const { isSubmitting } = useFormState({ control });
  const password = useWatch({ control, name: 'password' });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.password,
      });
      toast.success('Use a nova senha nos próximos acessos.', 'Senha alterada');
      router.back();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  return (
    <Screen scroll keyboardAware>
      <ScreenHeader title="Alterar senha" />
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Por segurança, confirme sua senha atual antes de criar uma nova.
      </AppText>
      <View style={styles.form}>
        <FormTextField
          control={control}
          name="currentPassword"
          label="Senha atual"
          leftIcon="lock-closed-outline"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="next"
          onSubmitEditing={() => setFocus('password')}
          submitBehavior="submit"
        />
        <FormTextField
          control={control}
          name="password"
          label="Nova senha"
          leftIcon="key-outline"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          maxLength={LIMITS.password.max}
          returnKeyType="next"
          onSubmitEditing={() => setFocus('confirmPassword')}
          submitBehavior="submit"
        />
        <PasswordRules value={password ?? ''} />
        <FormTextField
          control={control}
          name="confirmPassword"
          label="Confirme a nova senha"
          leftIcon="key-outline"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          maxLength={LIMITS.password.max}
          returnKeyType="done"
          onSubmitEditing={() => void onSubmit()}
        />
      </View>
      <Button title="Salvar nova senha" onPress={onSubmit} loading={isSubmitting} fullWidth />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
});
