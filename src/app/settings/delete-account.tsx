import Ionicons from '@expo/vector-icons/Ionicons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { useDialog } from '@/components/feedback/dialog-provider';
import { useToast } from '@/components/feedback/toast-provider';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { FormTextField } from '@/components/ui/form-fields';
import { Card } from '@/components/ui/layout';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { colors, spacing } from '@/constants/theme';
import { useDeleteAccount } from '@/hooks/use-account';
import { DELETE_CONFIRMATION_WORD, deleteAccountSchema, type DeleteAccountValues } from '@/schemas/auth.schema';
import { getErrorMessage } from '@/utils/errors';

const WHAT_IS_DELETED = [
  'Sua conta de acesso (e-mail e senha)',
  'Seu perfil empresarial e todas as informações publicadas',
  'O logotipo e a foto de perfil enviados',
];

/** Exclusão definitiva da conta, iniciada pela própria usuária (LGPD, Apple e Google). */
export default function DeleteAccountScreen() {
  const dialog = useDialog();
  const toast = useToast();
  const deleteAccount = useDeleteAccount();
  const { control, handleSubmit } = useForm<DeleteAccountValues>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { confirmation: '' },
    mode: 'onTouched',
  });

  const onSubmit = handleSubmit(async () => {
    const confirmed = await dialog.confirm({
      title: 'Excluir sua conta definitivamente?',
      message: 'Esta ação não pode ser desfeita. Você precisará criar uma nova conta para voltar ao Mural.',
      confirmLabel: 'Excluir conta',
      destructive: true,
      icon: 'trash-outline',
    });
    if (!confirmed) return;
    try {
      await deleteAccount.mutateAsync();
      toast.success('Sua conta e seus dados foram excluídos. Obrigada por ter feito parte do Mural.', 'Conta excluída');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  return (
    <Screen scroll keyboardAware>
      <ScreenHeader title="Excluir conta" />
      <View style={styles.content}>
        <View style={styles.icon}>
          <Ionicons name="warning-outline" size={30} color={colors.danger} />
        </View>
        <AppText variant="title" accessibilityRole="header">
          Sentiremos sua falta
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Ao excluir sua conta, os dados abaixo são apagados de forma definitiva:
        </AppText>
        <Card style={styles.list}>
          {WHAT_IS_DELETED.map((item) => (
            <View key={item} style={styles.row}>
              <Ionicons name="close-circle" size={18} color={colors.danger} />
              <AppText variant="body" style={styles.flex}>
                {item}
              </AppText>
            </View>
          ))}
        </Card>
        <AppText variant="small" color={colors.textSecondary}>
          Denúncias que você fez continuam disponíveis para a moderação, sem identificar você. Registros técnicos mínimos
          podem ser mantidos pelo prazo exigido em lei (Marco Civil da Internet), sem qualquer exposição pública.
        </AppText>
        <AppText variant="small" color={colors.textSecondary}>
          Se quiser apenas sumir do Mural por um tempo, você pode retirar seu perfil temporariamente na aba Divulgar.
        </AppText>
        <FormTextField
          control={control}
          name="confirmation"
          label={`Para confirmar, digite ${DELETE_CONFIRMATION_WORD}`}
          placeholder={DELETE_CONFIRMATION_WORD}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <Button
          title="Excluir minha conta"
          variant="danger"
          icon="trash-outline"
          onPress={onSubmit}
          loading={deleteAccount.isPending}
          fullWidth
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  icon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  flex: {
    flex: 1,
  },
});
