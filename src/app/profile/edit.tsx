import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { EditProfileForm } from '@/components/profiles/edit-profile-form';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states';
import { radius, spacing } from '@/constants/theme';
import { useMyProfile, useUpdateProfile } from '@/hooks/use-profiles';

export default function EditProfileScreen() {
  const { data: profile, isPending, isError, error, refetch } = useMyProfile();

  if (isPending) {
    return (
      <Screen scroll>
        <ScreenHeader title="Editar perfil" />
        <View style={styles.loading}>
          <Skeleton height={52} borderRadius={radius.md} />
          <Skeleton height={52} borderRadius={radius.md} />
          <Skeleton height={140} borderRadius={radius.md} />
        </View>
      </Screen>
    );
  }
  if (isError) {
    return (
      <Screen>
        <ScreenHeader title="Editar perfil" />
        <ErrorState error={error} onRetry={() => refetch()} />
      </Screen>
    );
  }
  if (!profile) {
    return (
      <Screen>
        <ScreenHeader title="Editar perfil" />
        <EmptyState
          icon="storefront-outline"
          title="Você ainda não tem um perfil empresarial"
          message="Crie seu perfil para divulgar sua marca no Mural."
          actionLabel="Criar perfil"
          onAction={() => router.replace('/profile/create')}
        />
      </Screen>
    );
  }
  return <MyProfileForm profile={profile} />;
}

function MyProfileForm({ profile }: { profile: NonNullable<ReturnType<typeof useMyProfile>['data']> }) {
  const update = useUpdateProfile();
  return (
    <EditProfileForm
      profile={profile}
      onSave={(values) => update.mutateAsync({ profile, values })}
      saving={update.isPending}
      saved={update.isSuccess}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});
