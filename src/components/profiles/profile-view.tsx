import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_NAME } from '@/constants/app';
import { getPerkLabel } from '@/constants/perks';
import { colors, fonts, gradients, MAX_CONTENT_WIDTH, palette, radius, shadows, spacing } from '@/constants/theme';
import type { ProfileFormValues } from '@/schemas/profile.schema';
import type { EntrepreneurProfile, PublicProfile } from '@/types/models';
import { formatLocation, getInitials } from '@/utils/format';
import { sanitizeLine, sanitizeMultiline } from '@/utils/sanitize';
import { normalizeContact, normalizeSocialLink, normalizeUrl } from '@/utils/url';

import { AppText } from '../ui/app-text';
import { Pill } from '../ui/chip';
import { CategoryPill } from './badges';
import { ContactActions } from './contact-actions';
import { ProfileImage } from './profile-image';

export type ProfileViewData = {
  businessName: string;
  entrepreneurName: string;
  description: string;
  logoUri: string | null;
  photoUri: string | null;
  category: string | null;
  city: string | null;
  state: string | null;
  servesNationwide: boolean;
  perks: string[];
  socialUrl: string | null;
  contactUrl: string | null;
  websiteUrl: string | null;
};

export function profileToView(profile: PublicProfile | EntrepreneurProfile): ProfileViewData {
  return {
    businessName: profile.business_name,
    entrepreneurName: profile.entrepreneur_name,
    description: profile.service_description,
    logoUri: profile.logo_url,
    photoUri: profile.profile_image_url,
    category: profile.category,
    city: profile.city,
    state: profile.state,
    servesNationwide: profile.serves_nationwide,
    perks: profile.community_perks,
    socialUrl: profile.instagram_url,
    contactUrl: profile.contact_url,
    websiteUrl: profile.website_url,
  };
}

/** Prévia a partir do formulário (antes de salvar). */
export function formValuesToView(values: ProfileFormValues): ProfileViewData {
  return {
    businessName: sanitizeLine(values.businessName) || 'Nome da sua marca',
    entrepreneurName: sanitizeLine(values.entrepreneurName) || 'Seu nome',
    description: sanitizeMultiline(values.serviceDescription) || 'A descrição dos seus serviços aparece aqui.',
    logoUri: values.logoUri,
    photoUri: values.photoUri,
    category: values.category,
    city: sanitizeLine(values.city) || null,
    state: values.state,
    servesNationwide: values.servesNationwide,
    perks: values.communityPerks,
    socialUrl: normalizeSocialLink(values.social),
    contactUrl: normalizeContact(values.contact),
    websiteUrl: normalizeUrl(values.website),
  };
}

type ProfileViewProps = {
  data: ProfileViewData;
  /** Botões sobre a capa (voltar, menu). */
  topBar?: ReactNode;
  /** Aviso exibido acima do nome (ex.: "Esta é uma prévia"). */
  banner?: ReactNode;
  /** Conteúdo ao final (ex.: denunciar perfil). */
  footer?: ReactNode;
  /** Espaço extra no fim da rolagem (quando há barra fixa no rodapé). */
  extraBottomSpace?: number;
};

const HERO_HEIGHT = 250;

export function ProfileView({ data, topBar, banner, footer, extraBottomSpace = 0 }: ProfileViewProps) {
  const insets = useSafeAreaInsets();
  const location = formatLocation(data.city, data.state);
  const heroIsPhoto = Boolean(data.photoUri);
  const heroIsLogo = !heroIsPhoto && Boolean(data.logoUri);
  const heroHeight = HERO_HEIGHT + insets.top;

  return (
    <View style={styles.root}>
      <StatusBar style={heroIsLogo ? 'dark' : 'light'} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl + extraBottomSpace }}
      >
        <View style={{ height: heroHeight }}>
          {heroIsPhoto && data.photoUri ? (
            <>
              <Image
                source={{ uri: data.photoUri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={250}
                cachePolicy="memory-disk"
                accessibilityLabel={`Foto de ${data.entrepreneurName}`}
              />
              <LinearGradient
                colors={['rgba(35,33,38,0.45)', 'rgba(35,33,38,0)', 'rgba(35,33,38,0.25)']}
                locations={[0, 0.45, 1]}
                style={StyleSheet.absoluteFill}
              />
            </>
          ) : heroIsLogo && data.logoUri ? (
            <LinearGradient colors={gradients.blush} style={[styles.heroCenter, { paddingTop: insets.top }]}>
              <View style={styles.heroBlobA} />
              <View style={styles.heroBlobB} />
              <Animated.View entering={FadeIn.duration(300)} style={styles.heroLogo}>
                <ProfileImage uri={data.logoUri} name={data.businessName} size={140} shape="circle" />
              </Animated.View>
            </LinearGradient>
          ) : (
            <LinearGradient
              colors={gradients.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.heroCenter, { paddingTop: insets.top }]}
            >
              <View style={styles.heroGlowA} />
              <View style={styles.heroGlowB} />
              <AppText style={styles.heroMonogram} color="rgba(255,255,255,0.94)" maxFontSizeMultiplier={1}>
                {getInitials(data.businessName)}
              </AppText>
            </LinearGradient>
          )}
          {topBar ? <View style={[styles.topBar, { top: insets.top + spacing.xs }]}>{topBar}</View> : null}
        </View>

        <View style={styles.sheet}>
          <View style={styles.inner}>
            {heroIsPhoto && data.logoUri ? (
              <ProfileImage uri={data.logoUri} name={data.businessName} size={76} style={styles.logoBadge} />
            ) : null}

            {banner}

            <Animated.View entering={FadeInDown.duration(320)} style={styles.headerBlock}>
              <AppText variant="display" accessibilityRole="header">
                {data.businessName}
              </AppText>
              <View style={styles.byline}>
                <Ionicons name="person-circle-outline" size={18} color={colors.accentText} />
                <AppText variant="bodyStrong" color={colors.textSecondary}>
                  por {data.entrepreneurName}
                </AppText>
              </View>
              <View style={styles.tags}>
                <CategoryPill slug={data.category} size="md" />
                {location ? <Pill icon="location-outline" label={location} size="md" /> : null}
                {data.servesNationwide ? <Pill icon="globe-outline" label="Atende todo o Brasil" size="md" /> : null}
              </View>
            </Animated.View>

            <ContactActions contactUrl={data.contactUrl} socialUrl={data.socialUrl} websiteUrl={data.websiteUrl} />

            <View style={styles.section}>
              <AppText variant="eyebrow" color={colors.accentText}>
                Sobre o negócio
              </AppText>
              <AppText variant="body" selectable>
                {data.description}
              </AppText>
            </View>

            {data.perks.length > 0 ? (
              <View style={[styles.section, styles.perksCard]}>
                <View style={styles.perksHeader}>
                  <Ionicons name="heart-circle-outline" size={22} color={colors.primary} />
                  <AppText variant="subtitle" color={colors.primary} style={styles.flex}>
                    Cortesias para empreendedoras do Mural
                  </AppText>
                </View>
                {data.perks.map((perk) => {
                  const label = getPerkLabel(perk);
                  return label ? (
                    <View key={perk} style={styles.perkRow}>
                      <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                      <AppText variant="body" style={styles.flex}>
                        {label}
                      </AppText>
                    </View>
                  ) : null;
                })}
              </View>
            ) : null}

            <View style={styles.disclaimer}>
              <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
              <AppText variant="small" color={colors.textSecondary} style={styles.flex}>
                O {APP_NAME} apresenta negócios de empreendedoras. Cada empreendedora responde pelos produtos e serviços
                que oferece.
              </AppText>
            </View>

            {footer}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heroCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroBlobA: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -120,
    left: -80,
    backgroundColor: palette.lilac100,
  },
  heroBlobB: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    bottom: -60,
    right: -50,
    backgroundColor: colors.accentGlow,
  },
  heroLogo: {
    borderRadius: 999,
    borderWidth: 4,
    borderColor: palette.white,
    ...shadows.raised,
  },
  heroGlowA: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    top: -140,
    right: -100,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  heroGlowB: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    bottom: -50,
    left: -40,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  heroMonogram: {
    fontFamily: fonts.display,
    fontSize: 88,
    lineHeight: 100,
  },
  topBar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheet: {
    marginTop: -28,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  inner: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    gap: spacing.xl,
  },
  logoBadge: {
    marginTop: -spacing.xl - 44,
    borderWidth: 4,
    borderColor: colors.background,
    ...shadows.card,
  },
  headerBlock: {
    gap: spacing.xs,
  },
  byline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  section: {
    gap: spacing.xs,
  },
  perksCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.accentSubtle,
    borderWidth: 1,
    borderColor: colors.accentSoft,
  },
  perksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xxs,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  disclaimer: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  flex: {
    flex: 1,
  },
});
