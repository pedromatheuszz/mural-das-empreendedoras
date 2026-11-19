import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm, useFormState } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { useToast } from '@/components/feedback/toast-provider';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { FormTextField } from '@/components/ui/form-fields';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { colors, spacing } from '@/constants/theme';
import { forgotPasswordSchema, type ForgotPasswordValues } from '@/schemas/auth.schema';
import { requestPasswordReset } from '@/services/auth.service';
import { getErrorMessage } from '@/utils/errors';

export default function ForgotPasswordScreen() {
  const toast = useToast();
  const { control, handleSubmit } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
    mode: 'onTouched',
  });
  const { isSubmitting } = useFormState({ control });

  const onSubmit = handleSubmit(async ({ email }) => {
    try {
      await requestPasswordReset(email);
      toast.info('Se houver uma conta com este e-mail, você receberá um código para criar uma nova senha.');
      router.push({ pathname: '/reset-password', params: { email: email.trim() } });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  return (
    <Screen scroll keyboardAware>
      <ScreenHeader />
      <View style={styles.header}>
        <AppText variant="display" accessibilityRole="header">
          Recuperar senha
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Informe o e-mail da sua conta. Vamos enviar um código para você criar uma nova senha.
        </AppText>
      </View>
      <FormTextField
        control={control}
        name="email"
        label="E-mail"
        placeholder="nome@exemplo.com"
        leftIcon="mail-outline"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={() => void onSubmit()}
      />
      <Button title="Enviar código" onPress={onSubmit} loading={isSubmitting} fullWidth style={styles.submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  submit: {
    marginTop: spacing.xl,
  },
});
