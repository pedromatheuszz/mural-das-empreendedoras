import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { RestrictedScreen } from '@/components/admin/role-pill';
import { EditProfileForm } from '@/components/profiles/edit-profile-form';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states';
import { colors, radius, spacing } from '@/constants/theme';
import { useStaffProfile, useStaffUpdateProfile } from '@/hooks/use-admin';
import { usePermissions } from '@/hooks/use-permissions';
import type { EntrepreneurProfile } from '@/types/models';

/** Edição do conteúdo de um perfil pela equipe (desenvolvedor ou, nos perfis do grupo, administradora). */
export default function StaffEditProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const permissions = usePermissions();
  const query = useStaffProfile(id);

  if (!permissions.role || query.isPending) {
    return (
      <Screen>
        <ScreenHeader title="Editar perfil" />
        <Skeleton height={200} borderRadius={radius.xl} />
      </Screen>
    );
  }
  if (query.isError) {
    return (
      <Screen>
        <ScreenHeader title="Editar perfil" />
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      </Screen>
    );
  }
  if (!query.data) {
    return (
      <Screen>
        <ScreenHeader title="Editar perfil" />
        <EmptyState icon="search-outline" title="Perfil não encontrado" message="Ele pode ter sido excluído." />
      </Screen>
    );
  }
  if (!permissions.forProfile(query.data).canEdit) return <RestrictedScreen title="Editar perfil" />;
  return <StaffForm profile={query.data} />;
}

function StaffForm({ profile }: { profile: EntrepreneurProfile }) {
  const update = useStaffUpdateProfile();
  return (
    <EditProfileForm
      profile={profile}
      onSave={(values) => update.mutateAsync({ profile, values })}
      saving={update.isPending}
      saved={update.isSuccess}
      title="Editar perfil"
      successMessage={`As alterações em "${profile.business_name}" já estão no Mural.`}
      fallbackRoute="/admin/painel"
      notice={
        <View style={styles.notice}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
          <AppText variant="small" color={colors.primary} style={styles.flex}>
            Você está editando como equipe do Mural. A alteração fica registrada no histórico do perfil.
          </AppText>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    marginTop: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  flex: {
    flex: 1,
  },
});
