import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ProfileClaimPrompt } from '@/components/claims/claim-cards';
import { CommunityBanner } from '@/components/profiles/community-banner';
import { profileToView, ProfileView } from '@/components/profiles/profile-view';
import { AppText } from '@/components/ui/app-text';
import { IconButton } from '@/components/ui/icon-button';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states';
import { colors, radius, spacing } from '@/constants/theme';
import { usePermissions } from '@/hooks/use-permissions';
import { usePublicProfile } from '@/hooks/use-profiles';
import { useAuth } from '@/providers/auth-provider';

/** Perfil público completo de uma empreendedora. */
export default function EntrepreneurProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const permissions = usePermissions();
  const { data: profile, isPending, isError, error, refetch } = usePublicProfile(id);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/hub'));

  if (isPending) {
    return (
      <Screen safeTop={false}>
        <Skeleton height={280} borderRadius={0} />
        <View style={styles.loading}>
          <Skeleton width="70%" height={32} />
          <Skeleton width="40%" height={16} />
          <Skeleton height={54} borderRadius={radius.pill} />
          <Skeleton height={120} borderRadius={radius.lg} />
        </View>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ScreenHeader onBack={goBack} />
        <ErrorState error={error} onRetry={() => refetch()} />
      </Screen>
    );
  }

  const isOwner = Boolean(profile && user && profile.user_id === user.id);

  const canViewHidden = permissions.can('viewHiddenProfiles');

  if (!profile || (profile.publication_status !== 'published' && !isOwner && !canViewHidden)) {
    return (
      <Screen>
        <ScreenHeader onBack={goBack} />
        <EmptyState
          icon="eye-off-outline"
          title="Perfil indisponível"
          message="Este perfil não existe mais ou foi retirado do Mural pela empreendedora."
          actionLabel="Voltar para o Mural"
          onAction={() => router.replace('/hub')}
        />
      </Screen>
    );
  }

  return (
    <ProfileView
      data={profileToView(profile)}
      topBar={
        <>
          <IconButton icon="chevron-back" variant="glass" accessibilityLabel="Voltar para a lista" onPress={goBack} />
          {isOwner ? (
            <IconButton icon="create-outline" variant="glass" accessibilityLabel="Editar meu perfil" onPress={() => router.push('/profile/edit')} />
          ) : permissions.isStaff ? (
            <IconButton
              icon="shield-checkmark-outline"
              variant="glass"
              accessibilityLabel="Gerenciar este perfil (equipe do Mural)"
              onPress={() => router.push({ pathname: '/admin/profile/[id]', params: { id: profile.id } })}
            />
          ) : null}
        </>
      }
      banner={
        isOwner ? (
          <View style={styles.ownerBanner}>
            <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
            <AppText variant="small" color={colors.primary} style={styles.flex}>
              {profile.publication_status === 'published'
                ? 'Este é o seu perfil, do jeito que as outras pessoas veem.'
                : 'Este é o seu perfil. Ele ainda não está visível no Mural.'}
            </AppText>
          </View>
        ) : profile.publication_status !== 'published' ? (
          <View style={styles.ownerBanner}>
            <Ionicons name="eye-off-outline" size={18} color={colors.primary} />
            <AppText variant="small" color={colors.primary} style={styles.flex}>
              Este perfil não está visível no Mural. Você o vê porque faz parte da equipe.
            </AppText>
          </View>
        ) : profile.user_id === null ? (
          <CommunityBanner />
        ) : null
      }
      footer={
        isOwner ? null : (
          <View style={styles.footer}>
            <ProfileClaimPrompt profile={profile} />
            <Pressable
              onPress={() => router.push({ pathname: '/report/[id]', params: { id: profile.id, name: profile.business_name } })}
              accessibilityRole="button"
              accessibilityLabel="Denunciar este perfil"
              hitSlop={8}
              style={({ pressed }) => [styles.report, pressed ? styles.pressed : null]}
            >
              <Ionicons name="flag-outline" size={16} color={colors.textSecondary} />
              <AppText variant="smallStrong" color={colors.textSecondary}>
                Denunciar perfil
              </AppText>
            </Pressable>
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  ownerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  footer: {
    gap: spacing.md,
  },
  report: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.6,
  },
  flex: {
    flex: 1,
  },
});
