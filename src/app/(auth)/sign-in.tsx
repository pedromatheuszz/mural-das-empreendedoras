import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm, useFormState } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { AuthHeader } from '@/components/auth/auth-header';
import { useToast } from '@/components/feedback/toast-provider';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { FormTextField } from '@/components/ui/form-fields';
import { Screen } from '@/components/ui/screen';
import { TextLink } from '@/components/ui/text-link';
import { colors, spacing } from '@/constants/theme';
import { getDevLogin } from '@/lib/dev-login';
import { signInSchema, type SignInValues } from '@/schemas/auth.schema';
import { signIn } from '@/services/auth.service';
import { getErrorMessage } from '@/utils/errors';

export default function SignInScreen() {
  const toast = useToast();
  const { control, handleSubmit, setFocus } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });
  const { isSubmitting } = useFormState({ control });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signIn(values);
      // A navegação para o Mural acontece automaticamente quando a sessão é criada.
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === 'email_not_verified') {
        // O Neon Auth já envia um novo código quando a conta tenta entrar sem confirmar o e-mail.
        toast.info('Enviamos um código de confirmação para o seu e-mail.', 'Confirme seu e-mail');
        router.push({ pathname: '/verify-email', params: { email: values.email.trim() } });
        return;
      }
      toast.error(getErrorMessage(error));
    }
  });

  const devLogin = getDevLogin();
  const [devLoading, setDevLoading] = useState(false);
  const enterAsDeveloper = async () => {
    if (!devLogin) return;
    setDevLoading(true);
    try {
      await signIn(devLogin);
    } catch (error) {
      toast.error(getErrorMessage(error), 'Login de desenvolvedor');
    } finally {
      setDevLoading(false);
    }
  };

  return (
    <Screen scroll keyboardAware>
      <AuthHeader
        title="Bem-vinda de volta"
        subtitle="Entre para descobrir marcas incríveis e divulgar o seu negócio."
      />
      <View style={styles.form}>
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
          returnKeyType="next"
          onSubmitEditing={() => setFocus('password')}
          submitBehavior="submit"
        />
        <FormTextField
          control={control}
          name="password"
          label="Senha"
          placeholder="Sua senha"
          leftIcon="lock-closed-outline"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={() => void onSubmit()}
        />
        <TextLink
          label="Esqueci minha senha"
          onPress={() => router.push('/forgot-password')}
          style={styles.forgot}
        />
      </View>
      <Button title="Entrar" onPress={onSubmit} loading={isSubmitting} fullWidth testID="sign-in-submit" />
      {devLogin ? (
        <Button
          title="Login de desenvolvedor"
          icon="code-slash-outline"
          variant="secondary"
          onPress={enterAsDeveloper}
          loading={devLoading}
          fullWidth
          style={styles.devButton}
          accessibilityHint={`Entra com ${devLogin.email} (somente em desenvolvimento)`}
        />
      ) : null}
      <View style={styles.footer}>
        <AppText variant="small" color={colors.textSecondary}>
          Ainda não tem conta?
        </AppText>
        <TextLink label="Criar conta" onPress={() => router.replace('/sign-up')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  forgot: {
    alignSelf: 'flex-end',
    marginTop: -spacing.xs,
  },
  devButton: {
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.lg,
  },
});
