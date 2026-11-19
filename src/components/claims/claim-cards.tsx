import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useDialog } from '@/components/feedback/dialog-provider';
import { useToast } from '@/components/feedback/toast-provider';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/layout';
import { colors, radius, spacing } from '@/constants/theme';
import { useCancelProfileClaim, useMyProfileClaim } from '@/hooks/use-claims';
import { useMyProfile } from '@/hooks/use-profiles';
import type { MyClaim } from '@/services/claims.service';
import { getErrorMessage } from '@/utils/errors';

const openSearch = () => router.push('/search');

/**
 * Para quem ainda não tem perfil: convida a encontrar o próprio negócio no Mural (cadastrado
 * pela organização do grupo) e mostra o andamento do pedido de vínculo.
 */
export function ClaimEntryCard() {
  const { data: claim } = useMyProfileClaim();

  if (claim?.status === 'pending') return <PendingClaimCard claim={claim} />;

  if (claim?.status === 'rejected') {
    return (
      <Card style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="close-circle-outline" size={22} color={colors.danger} />
          <AppText variant="subtitle" style={styles.flex}>
            Pedido de vínculo não aprovado
          </AppText>
        </View>
        <AppText variant="small" color={colors.textSecondary}>
          O pedido para vincular “{claim.business_name}” à sua conta não foi aprovado
          {claim.review_note ? `: ${claim.review_note}` : '.'} Se o negócio é mesmo seu, fale com a administração do grupo
          ou faça um novo pedido.
        </AppText>
        <Button title="Encontrar meu negócio" icon="search" variant="secondary" size="md" onPress={openSearch} fullWidth />
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="link-outline" size={22} color={colors.primary} />
        <AppText variant="subtitle" style={styles.flex}>
          Seu negócio já está no Mural?
        </AppText>
      </View>
      <AppText variant="small" color={colors.textSecondary}>
        Muitas empreendedoras do grupo já foram cadastradas pela organização. Encontre o perfil do seu negócio e toque em
        “Este negócio é meu” para vinculá-lo à sua conta e editar quando quiser.
      </AppText>
      <Button title="Encontrar meu negócio" icon="search" variant="secondary" size="md" onPress={openSearch} fullWidth />
    </Card>
  );
}

function PendingClaimCard({ claim }: { claim: MyClaim }) {
  const dialog = useDialog();
  const toast = useToast();
  const cancel = useCancelProfileClaim();

  const onCancel = async () => {
    const confirmed = await dialog.confirm({
      title: 'Cancelar o pedido?',
      message: `O pedido para vincular “${claim.business_name}” à sua conta será cancelado.`,
      confirmLabel: 'Cancelar pedido',
      cancelLabel: 'Voltar',
      destructive: true,
      icon: 'close-circle-outline',
    });
    if (!confirmed) return;
    try {
      await cancel.mutateAsync(claim.id);
      toast.info('Pedido de vínculo cancelado.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="hourglass-outline" size={22} color={colors.primary} />
        <AppText variant="subtitle" style={styles.flex}>
          Pedido de vínculo em análise
        </AppText>
      </View>
      <AppText variant="small" color={colors.textSecondary}>
        Você pediu para vincular “{claim.business_name}” à sua conta. Assim que a administração do grupo confirmar, o perfil
        aparece aqui e você já pode editá-lo.
      </AppText>
      <View style={styles.actions}>
        <Button
          title="Ver perfil"
          size="md"
          variant="secondary"
          onPress={() => router.push({ pathname: '/entrepreneur/[id]', params: { id: claim.profile_id } })}
          style={styles.flex}
        />
        <Button
          title="Cancelar"
          size="md"
          variant="dangerGhost"
          onPress={onCancel}
          loading={cancel.isPending}
          style={styles.flex}
        />
      </View>
    </Card>
  );
}

/**
 * No perfil público de um negócio do grupo (sem dona no app): convida a empreendedora a
 * vincular o perfil à própria conta. Não aparece para quem já tem perfil.
 */
export function ProfileClaimPrompt({ profile }: { profile: { id: string; user_id: string | null } }) {
  const myProfile = useMyProfile();
  const { data: claim, isPending } = useMyProfileClaim();

  if (profile.user_id !== null || myProfile.isPending || myProfile.data || isPending) return null;

  if (claim?.status === 'pending') {
    if (claim.profile_id !== profile.id) return null;
    return (
      <View style={styles.notice}>
        <Ionicons name="hourglass-outline" size={18} color={colors.primary} />
        <AppText variant="small" color={colors.primary} style={styles.flex}>
          Seu pedido para vincular este perfil à sua conta está em análise pela administração do grupo.
        </AppText>
      </View>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="link-outline" size={22} color={colors.primary} />
        <AppText variant="subtitle" style={styles.flex}>
          Este negócio é seu?
        </AppText>
      </View>
      <AppText variant="small" color={colors.textSecondary}>
        Vincule este perfil à sua conta para atualizar fotos, serviços e contatos sempre que quiser. A administração do
        grupo confirma o pedido.
      </AppText>
      <Button
        title="Este negócio é meu"
        icon="link"
        size="md"
        onPress={() => router.push({ pathname: '/claim/[id]', params: { id: profile.id } })}
        fullWidth
      />
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
    gap: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  flex: {
    flex: 1,
  },
});
