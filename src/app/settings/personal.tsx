import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFormState } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { useToast } from '@/components/feedback/toast-provider';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { FormTextField } from '@/components/ui/form-fields';
import { Card } from '@/components/ui/layout';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ErrorState, Skeleton } from '@/components/ui/states';
import { LEGAL_ENTITY, LIMITS } from '@/constants/app';
import { colors, radius, spacing } from '@/constants/theme';
import { useAccount, useUpdateFullName } from '@/hooks/use-account';
import { personalDataSchema, type PersonalDataValues } from '@/schemas/auth.schema';
import type { Account } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';

/** Dados pessoais da conta (privados — não aparecem no perfil público). */
export default function PersonalDataScreen() {
  const account = useAccount();
  return (
    <Screen scroll keyboardAware>
      <ScreenHeader title="Dados pessoais" />
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Estes dados são privados e usados apenas para acessar e gerenciar sua conta. Eles não aparecem no seu perfil
        público.
      </AppText>
      {account.isPending ? (
        <View style={styles.loading}>
          <Skeleton height={150} borderRadius={radius.xl} />
          <Skeleton height={150} borderRadius={radius.xl} />
        </View>
      ) : account.isError ? (
        <ErrorState error={account.error} onRetry={() => account.refetch()} />
      ) : (
        <View style={styles.cards}>
          <NameForm account={account.data} />
          <EmailForm account={account.data} />
        </View>
      )}
    </Screen>
  );
}

function NameForm({ account }: { account: Account }) {
  const toast = useToast();
  const update = useUpdateFullName();
  const { control, handleSubmit, reset } = useForm<PersonalDataValues>({
    resolver: zodResolver(personalDataSchema),
    defaultValues: { fullName: account.full_name },
    mode: 'onTouched',
  });
  const { isDirty } = useFormState({ control });

  const save = handleSubmit(async ({ fullName }) => {
    try {
      await update.mutateAsync(fullName);
      reset({ fullName });
      toast.success('Seu nome foi atualizado.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  return (
    <Card style={styles.card}>
      <FormTextField
        control={control}
        name="fullName"
        label="Nome completo"
        leftIcon="person-outline"
        autoCapitalize="words"
        autoComplete="name"
        maxLength={LIMITS.fullName.max}
      />
      <Button title="Salvar nome" size="md" onPress={save} loading={update.isPending} disabled={!isDirty} fullWidth />
    </Card>
  );
}

/** O e-mail de acesso é gerenciado pelo Neon Auth; a troca é feita pelo suporte. */
function EmailForm({ account }: { account: Account }) {
  return (
    <Card style={styles.card}>
      <AppText variant="subtitle">E-mail de acesso</AppText>
      <AppText variant="body" selectable>
        {account.email}
      </AppText>
      <AppText variant="small" color={colors.textSecondary}>
        Para trocar o e-mail de acesso, escreva para {LEGAL_ENTITY.supportEmail} a partir deste endereço.
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  loading: {
    gap: spacing.md,
  },
  cards: {
    gap: spacing.lg,
  },
  card: {
    gap: spacing.md,
  },
});
