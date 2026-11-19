import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { colors, palette, radius, shadows, spacing } from '@/constants/theme';
import type { ProfileSummary, PublicationStatus } from '@/types/models';
import { getFirstName } from '@/utils/format';

import { FEATURED_CARD_WIDTH, FeaturedProfileCard, FeaturedProfileCardSkeleton } from '../profiles/featured-profile-card';
import { AppText } from '../ui/app-text';
import { Avatar } from '../ui/avatar';
import { Button } from '../ui/button';
import { SectionHeader } from '../ui/layout';
import { PRESS_SCALE } from '@/constants/motion';
import { PressableScale } from '@/components/ui/pressable-scale';

function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function HubHeader({ fullName, photoUri }: { fullName?: string; photoUri?: string | null }) {
  const firstName = getFirstName(fullName);
  return (
    <View style={styles.header}>
      <View style={styles.flex}>
        <AppText variant="eyebrow" color={colors.accentText}>
          {firstName ? `${greeting()}, ${firstName}` : greeting()}
        </AppText>
        <AppText variant="display" accessibilityRole="header">
          Mural das Empreendedoras
        </AppText>
      </View>
      <Pressable
        onPress={() => router.navigate('/me')}
        accessibilityRole="button"
        accessibilityLabel="Abrir Meu Perfil"
        hitSlop={6}
      >
        <Avatar uri={photoUri} name={fullName || 'Você'} size={48} ring />
      </Pressable>
    </View>
  );
}

export function SearchPill() {
  return (
    <PressableScale
      onPress={() => router.navigate({ pathname: '/search', params: { focus: String(Date.now()) } })}
      accessibilityRole="search"
      accessibilityLabel="Buscar marcas, nomes ou serviços"
      scaleTo={PRESS_SCALE.card}
      style={styles.searchPill}
      pressedStyle={styles.searchPillPressed}
    >
      <Ionicons name="search" size={20} color={colors.primary} />
      <AppText variant="body" color={colors.textMuted} style={styles.flex} numberOfLines={1}>
        Buscar marcas, nomes ou serviços
      </AppText>
      <View style={styles.searchAction}>
        <Ionicons name="options-outline" size={18} color={colors.onPrimary} />
      </View>
    </PressableScale>
  );
}

type RecentCarouselProps = {
  profiles: ProfileSummary[] | undefined;
  isPending: boolean;
  onOpen: (id: string) => void;
};

/** Destaques "Recém-chegadas" — os perfis publicados mais recentemente. */
export function RecentCarousel({ profiles, isPending, onOpen }: RecentCarouselProps) {
  if (!isPending && (!profiles || profiles.length === 0)) return null;
  return (
    <View style={styles.carousel}>
      <View style={styles.padded}>
        <SectionHeader eyebrow="Novidades" title="Recém-chegadas" />
      </View>
      {isPending ? (
        <View style={[styles.skeletonRow, styles.padded]}>
          <FeaturedProfileCardSkeleton />
          <FeaturedProfileCardSkeleton />
        </View>
      ) : (
        <FlatList
          data={profiles}
          horizontal
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          snapToInterval={FEATURED_CARD_WIDTH + spacing.sm}
          decelerationRate="fast"
          contentContainerStyle={styles.carouselContent}
          renderItem={({ item }) => <FeaturedProfileCard profile={item} onPress={() => onOpen(item.id)} />}
        />
      )}
    </View>
  );
}

/** Convite para divulgar (inspirado no "Você também tem um negócio?" do mural original). */
export function PublishCta({ status }: { status: PublicationStatus | null }) {
  if (status === 'published' || status === 'suspended') return null;
  const content =
    status === 'draft'
      ? {
          eyebrow: 'Quase lá',
          title: 'Seu perfil está em rascunho',
          text: 'Revise as informações e publique para aparecer no Mural.',
          action: 'Publicar agora',
          onPress: () => router.navigate('/publish'),
        }
      : status === 'unpublished'
        ? {
            eyebrow: 'Fora do Mural',
            title: 'Seu perfil está oculto',
            text: 'Você retirou seu perfil temporariamente. Volte quando quiser.',
            action: 'Publicar novamente',
            onPress: () => router.navigate('/publish'),
          }
        : {
            eyebrow: 'Divulgue sua marca',
            title: 'Você também tem um negócio?',
            text: 'Crie seu perfil em poucos minutos e seja encontrada por novas clientes e parceiras.',
            action: 'Criar meu perfil',
            onPress: () => router.push('/profile/create'),
          };

  return (
    <View style={[styles.cta, styles.paddedMargin]}>
      <View style={styles.ctaGlowA} />
      <View style={styles.ctaGlowB} />
      <AppText variant="eyebrow" color={palette.lilac300}>
        {content.eyebrow}
      </AppText>
      <AppText variant="title" color={palette.white}>
        {content.title}
      </AppText>
      <AppText variant="body" color="rgba(255,255,255,0.82)">
        {content.text}
      </AppText>
      <Button title={content.action} variant="inverse" size="md" icon="arrow-forward" iconPosition="right" onPress={content.onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.lg,
  },
  paddedMargin: {
    marginHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingLeft: spacing.md,
    paddingRight: 6,
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  searchPillPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  searchAction: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  carousel: {
    gap: spacing.sm,
  },
  carouselContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    overflow: 'hidden',
  },
  cta: {
    gap: spacing.xs,
    padding: spacing.xl,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    backgroundColor: colors.primary,
    ...shadows.raised,
  },
  ctaGlowA: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -90,
    right: -70,
    backgroundColor: colors.accentGlowStrong,
  },
  ctaGlowB: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    bottom: -50,
    right: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});
