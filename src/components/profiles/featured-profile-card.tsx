import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { getCategory } from '@/constants/categories';
import { fonts, gradients, palette, radius, shadows, spacing } from '@/constants/theme';
import type { ProfileSummary } from '@/types/models';
import { useImageFallback } from '@/hooks/use-image-fallback';
import { getInitials } from '@/utils/format';

import { AppText } from '../ui/app-text';
import { Pill } from '../ui/chip';
import { Skeleton } from '../ui/states';
import { ProfileImage } from './profile-image';

export const FEATURED_CARD_WIDTH = 212;
const CARD_HEIGHT = 284;

/** Card vertical de destaque ("Recém-chegadas"), com foto em tela cheia. */
export function FeaturedProfileCard({ profile, onPress }: { profile: ProfileSummary; onPress: () => void }) {
  // Foto da empreendedora ocupa a capa inteira; logotipo (ou foto do Instagram) fica em destaque no centro.
  const { uri: cover, onError } = useImageFallback(profile.profile_image_url);
  const showLogoBadge = Boolean(profile.profile_image_url && profile.logo_url);
  const category = getCategory(profile.category);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${profile.business_name}, por ${profile.entrepreneur_name}${category ? `. ${category.label}` : ''}`}
      accessibilityHint="Abre o perfil completo"
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      {cover ? (
        <Image
          source={{ uri: cover }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={250}
          cachePolicy="memory-disk"
          recyclingKey={cover}
          onError={onError}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fallback}>
          <View style={styles.glowLarge} />
          <View style={styles.glowSmall} />
          {profile.logo_url ? (
            <ProfileImage uri={profile.logo_url} name={profile.business_name} size={108} shape="circle" style={styles.centerLogo} />
          ) : (
            <AppText style={styles.monogram} color="rgba(255,255,255,0.92)" maxFontSizeMultiplier={1}>
              {getInitials(profile.business_name)}
            </AppText>
          )}
        </LinearGradient>
      )}
      <LinearGradient colors={gradients.photoScrim} locations={[0.35, 0.6, 1]} style={StyleSheet.absoluteFill} />
      {showLogoBadge ? (
        <ProfileImage uri={profile.logo_url} name={profile.business_name} size={44} style={styles.logoBadge} />
      ) : null}
      <View style={styles.content}>
        {category ? (
          <Pill
            label={category.label}
            icon={category.icon}
            background="rgba(255,255,255,0.2)"
            foreground={palette.white}
          />
        ) : null}
        <AppText variant="title" color={palette.white} numberOfLines={2} style={styles.title}>
          {profile.business_name}
        </AppText>
        <AppText variant="small" color="rgba(255,255,255,0.86)" numberOfLines={1}>
          por {profile.entrepreneur_name}
        </AppText>
      </View>
    </Pressable>
  );
}

export function FeaturedProfileCardSkeleton() {
  return <Skeleton width={FEATURED_CARD_WIDTH} height={CARD_HEIGHT} borderRadius={radius.xxl} />;
}

const styles = StyleSheet.create({
  card: {
    width: FEATURED_CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    backgroundColor: palette.wine700,
    ...shadows.raised,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowLarge: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -90,
    right: -110,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  glowSmall: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    bottom: 40,
    left: -60,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  monogram: {
    fontFamily: fonts.display,
    fontSize: 72,
    lineHeight: 84,
    marginTop: -40,
  },
  centerLogo: {
    marginTop: -104,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.92)',
  },
  logoBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    borderWidth: 2,
    borderColor: palette.white,
  },
  content: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    gap: 4,
  },
  title: {
    marginTop: spacing.xxs,
  },
});
