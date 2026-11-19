import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { useTabBarSpace } from '@/components/navigation/tab-bar';
import { OnboardingArt } from '@/components/onboarding/onboarding-art';
import { ProfileCard } from '@/components/profiles/profile-card';
import { PublicationPanel, useDeleteProfileAction } from '@/components/profiles/publication-panel';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/layout';
import { ListGroup, ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { ErrorState, Skeleton } from '@/components/ui/states';
import { colors, radius, spacing } from '@/constants/theme';
import { useMyProfile } from '@/hooks/use-profiles';
import type { EntrepreneurProfile } from '@/types/models';

/**
 * Aba "Divulgar": formulário de criação para quem ainda não tem perfil empresarial
 * ou gerenciamento do perfil para quem já criou.
 */
export default function PublishScreen() {
  const { data: profile, isPending, isError, error, refetch, isRefetching } = useMyProfile();
  const tabBarSpace = useTabBarSpace();

  if (isPending) {
    return (
      <Screen scroll contentStyle={{ paddingBottom: tabBarSpace }}>
        <View style={styles.loading}>
          <Skeleton width="60%" height={30} />
          <Skeleton height={140} borderRadius={radius.xl} />
          <Skeleton height={180} borderRadius={radius.xl} />
        </View>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ErrorState error={error} onRetry={() => refetch()} />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      contentStyle={{ paddingBottom: tabBarSpace }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} colors={[colors.primary]} />
      }
    >
      {profile ? <ManageProfile profile={profile} /> : <CreateIntro />}
    </Screen>
  );
}

const BENEFITS = [
  { icon: 'storefront-outline', text: 'Perfil profissional com logotipo, foto e descrição dos serviços' },
  { icon: 'search-outline', text: 'Apareça na busca por marca, nome ou serviço' },
  { icon: 'chatbubbles-outline', text: 'Contato direto pelo WhatsApp, Instagram ou site' },
] as const;

function CreateIntro() {
  return (
    <View style={styles.stack}>
      <View style={styles.art}>
        <OnboardingArt variant="cards" />
      </View>
      <View style={styles.texts}>
        <AppText variant="eyebrow" color={colors.accentText}>
          Divulgar
        </AppText>
        <AppText variant="display" accessibilityRole="header">
          Coloque seu negócio no Mural
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Em poucos passos você cria um perfil profissional para a sua marca e passa a ser encontrada por novas clientes e
          parceiras.
        </AppText>
      </View>
      <View style={styles.benefits}>
        {BENEFITS.map((benefit) => (
          <View key={benefit.text} style={styles.benefit}>
            <View style={styles.benefitIcon}>
              <Ionicons name={benefit.icon} size={20} color={colors.primary} />
            </View>
            <AppText variant="body" style={styles.flex}>
              {benefit.text}
            </AppText>
          </View>
        ))}
      </View>
      <View style={styles.time}>
        <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
        <AppText variant="small" color={colors.textSecondary}>
          Leva cerca de 3 minutos. Você revisa tudo antes de publicar.
        </AppText>
      </View>
      <Button
        title="Criar meu perfil empresarial"
        icon="arrow-forward"
        iconPosition="right"
        onPress={() => router.push('/profile/create')}
        fullWidth
      />
    </View>
  );
}

function ManageProfile({ profile }: { profile: EntrepreneurProfile }) {
  const { remove } = useDeleteProfileAction();
  const isPublished = profile.publication_status === 'published';

  return (
    <View style={styles.stack}>
      <View style={styles.texts}>
        <AppText variant="eyebrow" color={colors.accentText}>
          Divulgar
        </AppText>
        <AppText variant="display" accessibilityRole="header">
          Seu negócio no Mural
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Acompanhe o status de publicação e mantenha suas informações sempre atualizadas.
        </AppText>
      </View>

      <PublicationPanel profile={profile} />

      <View style={styles.preview}>
        <SectionHeader
          title="Como as pessoas veem"
          actionLabel="Prévia completa"
          onAction={() => router.push('/profile/preview')}
        />
        <ProfileCard profile={profile} onPress={() => router.push('/profile/preview')} />
      </View>

      <ListGroup title="Gerenciar">
        <ListRow
          icon="create-outline"
          title="Editar informações"
          subtitle="Nome da marca, descrição, contatos e localização"
          onPress={() => router.push('/profile/edit')}
        />
        <ListRow
          icon="images-outline"
          title="Gerenciar imagens"
          subtitle="Logotipo e foto de perfil"
          onPress={() => router.push({ pathname: '/profile/edit', params: { section: 'images' } })}
        />
        {isPublished ? (
          <ListRow
            icon="open-outline"
            title="Ver meu perfil público"
            onPress={() => router.push({ pathname: '/entrepreneur/[id]', params: { id: profile.id } })}
          />
        ) : null}
      </ListGroup>

      <ListGroup title="Zona de cuidado">
        <ListRow
          icon="trash-outline"
          title="Excluir perfil empresarial"
          subtitle="Apaga o perfil e as imagens. Sua conta continua ativa."
          destructive
          onPress={() => void remove(profile)}
        />
      </ListGroup>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    gap: spacing.lg,
  },
  stack: {
    gap: spacing.xl,
  },
  art: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  texts: {
    gap: spacing.xs,
  },
  benefits: {
    gap: spacing.sm,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  preview: {
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
