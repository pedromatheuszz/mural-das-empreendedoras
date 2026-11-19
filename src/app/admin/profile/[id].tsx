import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { RestrictedScreen } from '@/components/admin/role-pill';
import { useDialog } from '@/components/feedback/dialog-provider';
import { useToast } from '@/components/feedback/toast-provider';
import { StatusBadge } from '@/components/profiles/badges';
import { ProfileImage } from '@/components/profiles/profile-image';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/layout';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { colors, radius, spacing } from '@/constants/theme';
import { useModerateProfile, useStaffDeleteProfile, useStaffProfile } from '@/hooks/use-admin';
import { usePermissions } from '@/hooks/use-permissions';
import type { EntrepreneurProfile } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { formatDate } from '@/utils/format';

/** Gerenciar um perfil: editar, suspender/reativar e excluir, conforme o cargo. */
export default function ManageProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const permissions = usePermissions();
  const query = useStaffProfile(id);

  if (!permissions.role || query.isPending) {
    return (
      <Screen>
        <ScreenHeader title="Gerenciar perfil" />
        <View style={styles.loading}>
          <Skeleton height={96} borderRadius={radius.xl} />
          <Skeleton height={180} borderRadius={radius.xl} />
        </View>
      </Screen>
    );
  }
  if (!permissions.isStaff) return <RestrictedScreen title="Gerenciar perfil" />;
  if (query.isError) {
    return (
      <Screen>
        <ScreenHeader title="Gerenciar perfil" />
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      </Screen>
    );
  }
  if (!query.data) {
    return (
      <Screen>
        <ScreenHeader title="Gerenciar perfil" />
        <EmptyState icon="search-outline" title="Perfil não encontrado" message="Ele pode ter sido excluído." />
      </Screen>
    );
  }
  return <ManageProfile profile={query.data} />;
}

function ManageProfile({ profile }: { profile: EntrepreneurProfile }) {
  const permissions = usePermissions();
  const abilities = permissions.forProfile(profile);
  const dialog = useDialog();
  const toast = useToast();
  const moderate = useModerateProfile();
  const remove = useStaffDeleteProfile();
  const [reason, setReason] = useState('');
  const suspended = profile.publication_status === 'suspended';
  const busy = moderate.isPending || remove.isPending;

  const suspend = async () => {
    if (reason.trim().length < 5) {
      toast.error('Escreva o motivo da suspensão (ele aparece para a empreendedora).');
      return;
    }
    const confirmed = await dialog.confirm({
      title: 'Suspender este perfil?',
      message: 'Ele sai do Mural na hora. A empreendedora vê o motivo e não consegue reativá-lo sozinha.',
      confirmLabel: 'Suspender',
      destructive: true,
      icon: 'ban-outline',
    });
    if (!confirmed) return;
    try {
      await moderate.mutateAsync({ profileId: profile.id, status: 'suspended', reason });
      setReason('');
      toast.success('Perfil suspenso.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const reactivate = async () => {
    try {
      await moderate.mutateAsync({ profileId: profile.id, status: 'published' });
      toast.success('Perfil reativado e de volta ao Mural.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const destroy = async () => {
    const confirmed = await dialog.confirm({
      title: 'Excluir este perfil?',
      message: `"${profile.business_name}" será apagado do Mural definitivamente. Esta ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      destructive: true,
      icon: 'trash-outline',
    });
    if (!confirmed) return;
    try {
      await remove.mutateAsync(profile.id);
      toast.success('Perfil excluído.');
      router.replace('/admin/painel');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Screen scroll keyboardAware>
      <ScreenHeader title="Gerenciar perfil" />
      <View style={styles.sections}>
        <Card style={styles.summary}>
          <ProfileImage uri={profile.logo_url} name={profile.business_name} size={64} shape="circle" />
          <View style={styles.flex}>
            <AppText variant="subtitle" numberOfLines={2}>
              {profile.business_name}
            </AppText>
            <AppText variant="small" color={colors.textSecondary} numberOfLines={1}>
              {profile.user_id ? `por ${profile.entrepreneur_name}` : 'Perfil do grupo (sem conta no app)'}
            </AppText>
            <View style={styles.badges}>
              <StatusBadge status={profile.publication_status} />
            </View>
          </View>
        </Card>

        <Button
          title="Ver perfil público"
          icon="eye-outline"
          variant="secondary"
          onPress={() => router.push({ pathname: '/entrepreneur/[id]', params: { id: profile.id } })}
          fullWidth
        />

        {abilities.canEdit ? (
          <Button
            title="Editar conteúdo"
            icon="create-outline"
            variant="secondary"
            onPress={() => router.push({ pathname: '/admin/edit/[id]', params: { id: profile.id } })}
            fullWidth
          />
        ) : null}

        {abilities.canModerate ? (
          <Card style={styles.block}>
            <AppText variant="heading">Moderação</AppText>
            {suspended ? (
              <>
                <AppText variant="small" color={colors.textSecondary}>
                  Suspenso em {formatDate(profile.suspended_at)}.{' '}
                  {profile.suspension_reason ? `Motivo: ${profile.suspension_reason}` : ''}
                </AppText>
                <Button title="Reativar perfil" icon="refresh" onPress={reactivate} loading={moderate.isPending} disabled={busy} fullWidth />
              </>
            ) : (
              <>
                <TextField
                  label="Motivo da suspensão"
                  helper="Aparece para a empreendedora no perfil dela."
                  value={reason}
                  onChangeText={setReason}
                  maxLength={500}
                  multiline
                  showCounter
                />
                <Button title="Suspender perfil" icon="ban-outline" variant="danger" onPress={suspend} loading={moderate.isPending} disabled={busy} fullWidth />
              </>
            )}
          </Card>
        ) : null}

        {abilities.canDelete ? (
          <Button title="Excluir perfil" icon="trash-outline" variant="dangerGhost" onPress={destroy} loading={remove.isPending} disabled={busy} fullWidth />
        ) : (
          <AppText variant="caption" color={colors.textMuted} align="center">
            {abilities.isOwner
              ? 'Este é o seu próprio perfil: gerencie-o pela aba Meu Perfil.'
              : 'Somente o desenvolvedor pode editar ou excluir o perfil de outra empreendedora.'}
          </AppText>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  sections: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  badges: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  block: {
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
});
