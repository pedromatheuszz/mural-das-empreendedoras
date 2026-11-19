import Ionicons from '@expo/vector-icons/Ionicons';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useDialog } from '@/components/feedback/dialog-provider';
import { useToast } from '@/components/feedback/toast-provider';
import { LEGAL_ENTITY } from '@/constants/app';
import { colors, radius, spacing } from '@/constants/theme';
import { useDeleteProfile, useSetPublicationStatus } from '@/hooks/use-profiles';
import type { EntrepreneurProfile } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { formatDate } from '@/utils/format';

import { AppText } from '../ui/app-text';
import { Button } from '../ui/button';
import { Card } from '../ui/layout';
import { STATUS_INFO, StatusBadge } from './badges';

/** Ações de publicar / retirar do Mural, com confirmação e consentimento. */
export function usePublicationActions(profile: EntrepreneurProfile | null | undefined) {
  const mutation = useSetPublicationStatus();
  const dialog = useDialog();
  const toast = useToast();

  const publish = async () => {
    if (!profile) return;
    if (!profile.public_consent_at) {
      // Primeira publicação: mostra a prévia e pede o consentimento.
      router.push({ pathname: '/profile/preview', params: { publish: '1' } });
      return;
    }
    try {
      await mutation.mutateAsync({ profileId: profile.id, status: 'published' });
      toast.success('Seu perfil já aparece para todas as usuárias.', 'Publicado no Mural');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const unpublish = async () => {
    if (!profile) return;
    const confirmed = await dialog.confirm({
      title: 'Retirar do Mural?',
      message:
        'Seu perfil deixa de aparecer na listagem e na busca até você publicar novamente. Nenhuma informação será apagada.',
      confirmLabel: 'Retirar do Mural',
      icon: 'eye-off-outline',
    });
    if (!confirmed) return;
    try {
      await mutation.mutateAsync({ profileId: profile.id, status: 'unpublished' });
      toast.info('Seu perfil foi retirado do Mural. Você pode publicar de novo quando quiser.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return { publish, unpublish, isPending: mutation.isPending };
}

/** Exclusão do perfil empresarial (a conta continua existindo). */
export function useDeleteProfileAction() {
  const mutation = useDeleteProfile();
  const dialog = useDialog();
  const toast = useToast();

  const remove = async (profile: EntrepreneurProfile | null | undefined) => {
    if (!profile) return false;
    const confirmed = await dialog.confirm({
      title: 'Excluir perfil empresarial?',
      message: `O perfil "${profile.business_name}", as imagens e as informações publicadas serão apagados definitivamente. Sua conta continua ativa.`,
      confirmLabel: 'Excluir perfil',
      destructive: true,
      icon: 'trash-outline',
    });
    if (!confirmed) return false;
    try {
      await mutation.mutateAsync(profile);
      toast.success('Seu perfil empresarial foi excluído.');
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    }
  };

  return { remove, isPending: mutation.isPending };
}

export function PublicationPanel({ profile }: { profile: EntrepreneurProfile }) {
  const { publish, unpublish, isPending } = usePublicationActions(profile);
  const info = STATUS_INFO[profile.publication_status];
  const status = profile.publication_status;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <StatusBadge status={status} size="md" />
        <AppText variant="caption" color={colors.textMuted}>
          Atualizado em {formatDate(profile.updated_at)}
        </AppText>
      </View>
      <AppText variant="body" color={colors.textSecondary}>
        {info.description}
      </AppText>

      {status === 'suspended' && profile.suspension_reason ? (
        <View style={styles.reason}>
          <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
          <AppText variant="small" color={colors.danger} style={styles.flex}>
            Motivo informado pela moderação: {profile.suspension_reason}
          </AppText>
        </View>
      ) : null}

      {status === 'published' ? (
        <Button
          title="Retirar do Mural temporariamente"
          icon="eye-off-outline"
          variant="secondary"
          onPress={unpublish}
          loading={isPending}
          fullWidth
        />
      ) : status === 'suspended' ? (
        <Button
          title="Falar com o suporte"
          icon="mail-outline"
          variant="secondary"
          onPress={() => Linking.openURL(`mailto:${LEGAL_ENTITY.supportEmail}?subject=Perfil%20suspenso`)}
          fullWidth
        />
      ) : (
        <Button
          title={status === 'draft' ? 'Publicar no Mural' : 'Publicar novamente'}
          icon="rocket-outline"
          onPress={publish}
          loading={isPending}
          fullWidth
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  reason: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
  },
  flex: {
    flex: 1,
  },
});
