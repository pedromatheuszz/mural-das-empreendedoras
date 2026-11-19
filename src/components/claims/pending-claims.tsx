import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useDialog } from '@/components/feedback/dialog-provider';
import { useToast } from '@/components/feedback/toast-provider';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/layout';
import { ErrorState, Skeleton } from '@/components/ui/states';
import { colors, radius, spacing } from '@/constants/theme';
import { usePendingClaims, useReviewProfileClaim } from '@/hooks/use-claims';
import type { PendingClaim } from '@/services/claims.service';
import { getErrorMessage } from '@/utils/errors';
import { formatDate, pluralize } from '@/utils/format';

const REJECT_NOTE = 'Não foi possível confirmar que o negócio é seu. Fale com a administração do grupo.';

/** Painel da equipe: pedidos de empreendedoras para vincular um perfil do grupo à conta. */
export function PendingClaimsSection() {
  const claims = usePendingClaims();

  if (claims.isPending) return <Skeleton height={120} borderRadius={radius.xl} />;
  if (claims.isError) return <ErrorState error={claims.error} onRetry={() => claims.refetch()} compact />;
  if (claims.data.length === 0) return null;

  return (
    <View style={styles.section}>
      <AppText variant="heading" accessibilityRole="header">
        Pedidos de vínculo
      </AppText>
      <AppText variant="small" color={colors.textSecondary}>
        {pluralize(claims.data.length, 'empreendedora quer', 'empreendedoras querem')} vincular um perfil do grupo à
        própria conta. Confira se a pessoa é mesmo a dona do negócio antes de aprovar.
      </AppText>
      {claims.data.map((claim) => (
        <ClaimRequestCard key={claim.id} claim={claim} />
      ))}
    </View>
  );
}

function ClaimRequestCard({ claim }: { claim: PendingClaim }) {
  const dialog = useDialog();
  const toast = useToast();
  const review = useReviewProfileClaim();
  const instagram = claim.instagram_url?.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@');

  const decide = async (approve: boolean) => {
    const confirmed = await dialog.confirm(
      approve
        ? {
            title: 'Aprovar o vínculo?',
            message: `“${claim.business_name}” passa a pertencer à conta de ${claim.account_name} (${claim.account_email}). Só ela poderá editar o conteúdo.`,
            confirmLabel: 'Aprovar',
            icon: 'checkmark-circle-outline',
          }
        : {
            title: 'Recusar o pedido?',
            message: `${claim.account_name} verá que o pedido não foi aprovado e poderá falar com a administração.`,
            confirmLabel: 'Recusar',
            destructive: true,
            icon: 'close-circle-outline',
          },
    );
    if (!confirmed) return;
    try {
      await review.mutateAsync({ claimId: claim.id, approve, note: approve ? undefined : REJECT_NOTE });
      toast.success(approve ? `${claim.account_name} agora edita “${claim.business_name}”.` : 'Pedido recusado.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Card style={styles.card}>
      <AppText variant="subtitle" numberOfLines={2}>
        {claim.business_name}
      </AppText>
      {instagram ? (
        <AppText variant="small" color={colors.textSecondary}>
          {instagram}
        </AppText>
      ) : null}
      <View style={styles.account}>
        <AppText variant="smallStrong">Pedido de {claim.account_name}</AppText>
        <AppText variant="small" color={colors.textSecondary} selectable>
          {claim.account_email}
        </AppText>
        {claim.message ? <AppText variant="small">“{claim.message}”</AppText> : null}
        <AppText variant="caption" color={colors.textMuted}>
          Enviado em {formatDate(claim.created_at)}
        </AppText>
      </View>
      <Button
        title="Ver perfil"
        icon="eye-outline"
        size="md"
        variant="secondary"
        onPress={() => router.push({ pathname: '/entrepreneur/[id]', params: { id: claim.profile_id } })}
        fullWidth
      />
      <View style={styles.actions}>
        <Button
          title="Aprovar"
          icon="checkmark"
          size="md"
          onPress={() => decide(true)}
          disabled={review.isPending}
          style={styles.flex}
        />
        <Button
          title="Recusar"
          size="md"
          variant="dangerGhost"
          onPress={() => decide(false)}
          disabled={review.isPending}
          style={styles.flex}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.xs,
  },
  account: {
    gap: 2,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
