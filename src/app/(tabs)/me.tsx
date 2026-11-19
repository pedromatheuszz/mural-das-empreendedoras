import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ClaimEntryCard } from '@/components/claims/claim-cards';
import { useDialog } from '@/components/feedback/dialog-provider';
import { useToast } from '@/components/feedback/toast-provider';
import { StatusBadge } from '@/components/profiles/badges';
import { useTabBarSpace } from '@/components/navigation/tab-bar';
import { useOpenLink } from '@/components/profiles/contact-actions';
import { ProfileImage } from '@/components/profiles/profile-image';
import { usePublicationActions } from '@/components/profiles/publication-panel';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/layout';
import { ListGroup, ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { ErrorState, Skeleton } from '@/components/ui/states';
import { SwitchRow } from '@/components/ui/switch-row';
import { APP_VERSION, COMMUNITY } from '@/constants/app';
import { colors, radius, spacing } from '@/constants/theme';
import { RolePill } from '@/components/admin/role-pill';
import { useAccount } from '@/hooks/use-account';
import { useScreenScrollToTop } from '@/hooks/use-screen-scroll-to-top';
import { usePermissions, useRefreshRoleOnFocus } from '@/hooks/use-permissions';
import { useMyProfile } from '@/hooks/use-profiles';
import { useAuth } from '@/providers/auth-provider';
import { signOut } from '@/services/auth.service';
import type { EntrepreneurProfile } from '@/types/models';
import { formatDate } from '@/utils/format';

export default function MeScreen() {
  const scrollRef = useScreenScrollToTop();
  const { user } = useAuth();
  const account = useAccount();
  const permissions = usePermissions();
  useRefreshRoleOnFocus();
  const myProfile = useMyProfile();
  const dialog = useDialog();
  const toast = useToast();
  const openLink = useOpenLink();
  const tabBarSpace = useTabBarSpace();
  const profile = myProfile.data ?? null;
  const name = account.data?.full_name ?? (user?.name || 'Você');

  const handleSignOut = async () => {
    const confirmed = await dialog.confirm({
      title: 'Sair da conta?',
      message: 'Você pode entrar novamente a qualquer momento com seu e-mail e senha.',
      confirmLabel: 'Sair',
      icon: 'log-out-outline',
    });
    if (!confirmed) return;
    await signOut();
    toast.info('Você saiu da sua conta.');
  };

  return (
    <Screen scroll scrollRef={scrollRef} contentStyle={{ paddingBottom: tabBarSpace }}>
      <View style={styles.header}>
        <Avatar uri={profile?.profile_image_url} name={name} size={88} ring />
        <View style={styles.headerTexts}>
          {account.isPending ? (
            <>
              <Skeleton width={180} height={24} />
              <Skeleton width={140} height={14} />
            </>
          ) : (
            <>
              <AppText variant="title" accessibilityRole="header" numberOfLines={2}>
                {name}
              </AppText>
              <AppText variant="small" color={colors.textSecondary} numberOfLines={1}>
                {account.data?.email ?? user?.email}
              </AppText>
              {permissions.role ? <RolePill role={permissions.role} /> : null}
              {account.data?.created_at ? (
                <AppText variant="caption" color={colors.textMuted}>
                  No Mural desde {formatDate(account.data.created_at)}
                </AppText>
              ) : null}
            </>
          )}
        </View>
      </View>

      <View style={styles.sections}>
        {myProfile.isError ? (
          <ErrorState error={myProfile.error} onRetry={() => myProfile.refetch()} compact />
        ) : myProfile.isPending ? (
          <Skeleton height={150} borderRadius={radius.xl} />
        ) : profile ? (
          <BusinessCard profile={profile} />
        ) : (
          <>
            <ClaimEntryCard />
            <Card style={styles.createCard}>
              <AppText variant="heading">Crie o perfil do seu negócio</AppText>
              <AppText variant="body" color={colors.textSecondary}>
                Divulgue sua marca e seus serviços para todas as usuárias do Mural.
              </AppText>
              <Button title="Criar perfil empresarial" icon="add" onPress={() => router.push('/profile/create')} fullWidth />
            </Card>
          </>
        )}

        {permissions.isStaff ? (
          <ListGroup title="Equipe do Mural">
            <ListRow
              icon="shield-checkmark-outline"
              title="Painel da equipe"
              subtitle={permissions.can('manageRoles') ? 'Denúncias, moderação e cargos' : 'Denúncias e moderação'}
              onPress={() => router.push('/admin/painel')}
            />
          </ListGroup>
        ) : null}

        <ListGroup title="Conta">
          <ListRow
            icon="person-outline"
            title="Dados pessoais"
            subtitle="Nome e e-mail da conta"
            onPress={() => router.push('/settings/personal')}
          />
          <ListRow icon="key-outline" title="Alterar senha" onPress={() => router.push('/settings/password')} />
        </ListGroup>

        {profile ? (
          <ListGroup title="Perfil empresarial">
            <ListRow icon="create-outline" title="Editar perfil" onPress={() => router.push('/profile/edit')} />
            <ListRow
              icon="images-outline"
              title="Gerenciar imagens"
              onPress={() => router.push({ pathname: '/profile/edit', params: { section: 'images' } })}
            />
            <ListRow icon="eye-outline" title="Ver prévia do perfil" onPress={() => router.push('/profile/preview')} />
          </ListGroup>
        ) : null}

        <ListGroup title="Privacidade e segurança">
          <ListRow
            icon="settings-outline"
            title="Configurações"
            subtitle="Segurança, privacidade e gerenciamento da conta"
            onPress={() => router.navigate('/config')}
          />
          <ListRow icon="shield-checkmark-outline" title="Política de Privacidade" onPress={() => router.push('/legal/privacy')} />
          <ListRow icon="document-text-outline" title="Termos de Uso" onPress={() => router.push('/legal/terms')} />
        </ListGroup>

        <ListGroup title="Comunidade">
          <ListRow
            icon="logo-instagram"
            title={`Grupo ${COMMUNITY.name}`}
            subtitle={`Siga ${COMMUNITY.instagramHandle} no Instagram`}
            onPress={() => void openLink(COMMUNITY.instagramUrl)}
          />
        </ListGroup>

        <ListGroup>
          <ListRow icon="log-out-outline" title="Sair da conta" onPress={handleSignOut} />
          <ListRow
            icon="trash-outline"
            title="Excluir minha conta"
            subtitle="Solicitar a exclusão da conta e dos dados"
            destructive
            onPress={() => router.push('/settings/delete-account')}
          />
        </ListGroup>

        <AppText variant="caption" color={colors.textMuted} align="center">
          Versão {APP_VERSION}
        </AppText>
      </View>
    </Screen>
  );
}

function BusinessCard({ profile }: { profile: EntrepreneurProfile }) {
  const { publish, unpublish, isPending } = usePublicationActions(profile);
  const status = profile.publication_status;
  const published = status === 'published';

  return (
    <Card style={styles.businessCard}>
      <View style={styles.businessHeader}>
        <ProfileImage uri={profile.logo_url ?? profile.profile_image_url} name={profile.business_name} size={56} />
        <View style={styles.flex}>
          <AppText variant="subtitle" numberOfLines={1}>
            {profile.business_name}
          </AppText>
          <StatusBadge status={status} />
        </View>
      </View>
      <View style={styles.divider} />
      <SwitchRow
        title="Visível no Mural"
        description={
          status === 'suspended'
            ? 'Perfil suspenso pela moderação.'
            : published
              ? 'Seu perfil aparece na listagem e na busca.'
              : 'Ative para publicar seu perfil.'
        }
        value={published}
        disabled={status === 'suspended' || isPending}
        onValueChange={(next) => void (next ? publish() : unpublish())}
      />
      <Button
        title="Gerenciar perfil empresarial"
        variant="soft"
        size="md"
        icon="arrow-forward"
        iconPosition="right"
        onPress={() => router.navigate('/publish')}
        fullWidth
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  headerTexts: {
    flex: 1,
    gap: 4,
  },
  sections: {
    gap: spacing.xl,
  },
  createCard: {
    gap: spacing.sm,
  },
  businessCard: {
    gap: spacing.sm,
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderStrong,
  },
  flex: {
    flex: 1,
    gap: 4,
  },
});
