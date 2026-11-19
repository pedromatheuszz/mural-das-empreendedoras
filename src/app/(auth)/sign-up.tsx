import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm, useFormState, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { AuthHeader } from '@/components/auth/auth-header';
import { PasswordRules } from '@/components/auth/password-rules';
import { useToast } from '@/components/feedback/toast-provider';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { FormCheckbox, FormTextField } from '@/components/ui/form-fields';
import { Screen } from '@/components/ui/screen';
import { TextLink } from '@/components/ui/text-link';
import { LIMITS } from '@/constants/app';
import { colors, spacing } from '@/constants/theme';
import { signUpSchema, type SignUpValues } from '@/schemas/auth.schema';
import { signUp } from '@/services/auth.service';
import { getErrorMessage } from '@/utils/errors';

export default function SignUpScreen() {
  const toast = useToast();
  const { control, handleSubmit, setFocus } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
      confirmAge: false,
    },
    mode: 'onTouched',
  });
  const { isSubmitting } = useFormState({ control });
  const password = useWatch({ control, name: 'password' });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { needsEmailConfirmation } = await signUp(values);
      if (needsEmailConfirmation) {
        toast.success('Enviamos um código de confirmação para o seu e-mail.', 'Conta criada!');
        router.replace({ pathname: '/verify-email', params: { email: values.email.trim() } });
      } else {
        toast.success('Agora é só criar o perfil do seu negócio.', 'Bem-vinda ao Mural!');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  return (
    <Screen scroll keyboardAware>
      <AuthHeader
        title="Crie sua conta"
        subtitle="Leva menos de um minuto. Depois, você monta o perfil do seu negócio."
      />
      <View style={styles.form}>
        <FormTextField
          control={control}
          name="fullName"
          label="Nome completo"
          placeholder="Ex.: Ana Souza"
          leftIcon="person-outline"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          maxLength={LIMITS.fullName.max}
          returnKeyType="next"
          onSubmitEditing={() => setFocus('email')}
          submitBehavior="submit"
        />
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
          label="Confirme a senha"
          placeholder="Digite a senha novamente"
          leftIcon="lock-closed-outline"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          maxLength={LIMITS.password.max}
          returnKeyType="done"
        />
        <View style={styles.checks}>
          <FormCheckbox
            control={control}
            name="acceptTerms"
            accessibilityLabel="Li e aceito os Termos de Uso e a Política de Privacidade"
            label={
              <AppText variant="small" color={colors.textSecondary}>
                Li e aceito os{' '}
                <AppText
                  variant="smallStrong"
                  color={colors.accentText}
                  style={styles.link}
                  onPress={() => router.push('/legal/terms')}
                  accessibilityRole="link"
                >
                  Termos de Uso
                </AppText>{' '}
                e a{' '}
                <AppText
                  variant="smallStrong"
                  color={colors.accentText}
                  style={styles.link}
                  onPress={() => router.push('/legal/privacy')}
                  accessibilityRole="link"
                >
                  Política de Privacidade
                </AppText>
                .
              </AppText>
            }
          />
          <FormCheckbox
            control={control}
            name="confirmAge"
            accessibilityLabel="Declaro ter 18 anos ou mais"
            label="Declaro ter 18 anos ou mais."
          />
        </View>
      </View>
      <Button title="Criar conta" onPress={onSubmit} loading={isSubmitting} fullWidth testID="sign-up-submit" />
      <View style={styles.footer}>
        <AppText variant="small" color={colors.textSecondary}>
          Já tem conta?
        </AppText>
        <TextLink label="Entrar" onPress={() => router.replace('/sign-in')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  checks: {
    gap: spacing.xs,
  },
  link: {
    textDecorationLine: 'underline',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.lg,
  },
});
