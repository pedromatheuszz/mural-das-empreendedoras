import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useForm, useFormState } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { useToast } from '@/components/feedback/toast-provider';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { FormTextField } from '@/components/ui/form-fields';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { colors, radius, spacing } from '@/constants/theme';
import { verifyCodeSchema, type VerifyCodeValues } from '@/schemas/auth.schema';
import { resendSignUpCode, verifySignUpCode } from '@/services/auth.service';
import { getErrorMessage } from '@/utils/errors';

const RESEND_COOLDOWN = 60;

export default function VerifyEmailScreen() {
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const toast = useToast();
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);
  const { control, handleSubmit } = useForm<VerifyCodeValues>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: { code: '' },
    mode: 'onTouched',
  });
  const { isSubmitting } = useFormState({ control });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const onSubmit = handleSubmit(async ({ code }) => {
    try {
      await verifySignUpCode(email, code);
      toast.success('Seu e-mail foi confirmado.', 'Bem-vinda ao Mural!');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  const resend = async () => {
    setResending(true);
    try {
      await resendSignUpCode(email);
      setCooldown(RESEND_COOLDOWN);
      toast.info('Enviamos um novo código. Confira também a caixa de spam.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setResending(false);
    }
  };

  return (
    <Screen scroll keyboardAware>
      <ScreenHeader onBack={() => router.replace('/sign-in')} />
      <View style={styles.header}>
        <AppText variant="display" accessibilityRole="header">
          Confirme seu e-mail
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Enviamos um código de confirmação para{' '}
          <AppText variant="bodyStrong">{email || 'o seu e-mail'}</AppText>. Digite o código abaixo ou toque no link da
          mensagem pelo celular.
        </AppText>
      </View>
      <FormTextField
        control={control}
        name="code"
        label="Código de confirmação"
        placeholder="000000"
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={10}
        returnKeyType="done"
        onSubmitEditing={() => void onSubmit()}
      />
      <Button title="Confirmar e entrar" onPress={onSubmit} loading={isSubmitting} fullWidth style={styles.submit} />
      <View style={styles.resendBox}>
        <AppText variant="small" color={colors.textSecondary} align="center">
          Não recebeu? Confira a caixa de spam ou peça um novo código.
        </AppText>
        <Button
          title={cooldown > 0 ? `Reenviar código em ${cooldown}s` : 'Reenviar código'}
          variant="ghost"
          size="md"
          onPress={resend}
          disabled={cooldown > 0 || !email}
          loading={resending}
          style={styles.center}
        />
      </View>
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
  resendBox: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceMuted,
    gap: spacing.xs,
  },
  center: {
    alignSelf: 'center',
  },
});
