import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, useFormState, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { PasswordRules } from '@/components/auth/password-rules';
import { useToast } from '@/components/feedback/toast-provider';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { FormTextField } from '@/components/ui/form-fields';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { EmptyState } from '@/components/ui/states';
import { LIMITS } from '@/constants/app';
import { colors, spacing } from '@/constants/theme';
import { resetWithCodeSchema, type ResetWithCodeValues } from '@/schemas/auth.schema';
import { updatePassword, verifyRecoveryCode } from '@/services/auth.service';
import { getErrorMessage } from '@/utils/errors';

/**
 * Nova senha: a usuária veio de "Esqueci minha senha" e digita o código recebido por e-mail.
 * Ao salvar, a senha é trocada e a usuária já entra na conta.
 */
export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const toast = useToast();
  const withCode = Boolean(email);

  const { control, handleSubmit, setFocus } = useForm<ResetWithCodeValues>({
    resolver: zodResolver(resetWithCodeSchema),
    defaultValues: { code: '', password: '', confirmPassword: '' },
    mode: 'onTouched',
  });
  const { isSubmitting } = useFormState({ control });
  const password = useWatch({ control, name: 'password' });

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (!email) return;
      await verifyRecoveryCode(email, values.code);
      await updatePassword(values.password);
      toast.success('Use a nova senha nos próximos acessos.', 'Senha alterada!');
      router.replace('/hub');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  if (!withCode) {
    return (
      <Screen>
        <ScreenHeader onBack={() => router.replace('/')} />
        <EmptyState
          icon="link-outline"
          title="Recupere sua senha"
          message="Peça um código de recuperação por e-mail para criar uma nova senha."
          actionLabel="Recuperar senha"
          onAction={() => router.replace('/forgot-password')}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll keyboardAware>
      <ScreenHeader onBack={() => router.replace('/')} />
      <View style={styles.header}>
        <AppText variant="display" accessibilityRole="header">
          Crie uma nova senha
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          {`Digite o código enviado para ${email} e escolha sua nova senha.`}
        </AppText>
      </View>
      <View style={styles.form}>
        <FormTextField
          control={control}
          name="code"
          label="Código recebido por e-mail"
          placeholder="000000"
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={10}
          returnKeyType="next"
          onSubmitEditing={() => setFocus('password')}
          submitBehavior="submit"
        />
        <FormTextField
          control={control}
          name="password"
          label="Nova senha"
          placeholder="Crie uma senha"
          leftIcon="lock-closed-outline"
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
          placeholder="Digite a senha novamente"
          leftIcon="lock-closed-outline"
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
  header: {
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
});
