import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

import { CATEGORIES } from '@/constants/categories';
import { colors, fonts, gradients, palette, radius, shadows, spacing } from '@/constants/theme';

import { AppText } from '../ui/app-text';
import { BrandMark } from '../ui/brand-mark';

export type OnboardingArtVariant = 'cards' | 'search' | 'network';

/** Ilustrações do onboarding desenhadas com componentes (leves e nítidas em qualquer tela). */
export function OnboardingArt({ variant }: { variant: OnboardingArtVariant }) {
  return (
    <View style={styles.stage} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.halo} />
      {variant === 'cards' ? <CardsArt /> : variant === 'search' ? <SearchArt /> : <NetworkArt />}
    </View>
  );
}

function CardsArt() {
  const beauty = CATEGORIES[0];
  return (
    <>
      <View style={[styles.backCard, { transform: [{ rotate: '9deg' }, { translateX: 46 }] }]} />
      <LinearGradient
        colors={gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.frontCard, { transform: [{ rotate: '-5deg' }] }]}
      >
        <View style={styles.cardGlow} />
        <AppText style={styles.monogram} color="rgba(255,255,255,0.92)">
          DA
        </AppText>
        <View style={styles.cardFooter}>
          <View style={styles.glassPill}>
            <Ionicons name={beauty.icon} size={12} color={palette.white} />
            <AppText variant="caption" color={palette.white}>
              Beleza & Estética
            </AppText>
          </View>
          <AppText variant="heading" color={palette.white}>
            Studio Dandara
          </AppText>
          <AppText variant="caption" color="rgba(255,255,255,0.85)">
            por Dandara Lima
          </AppText>
        </View>
      </LinearGradient>
      <View style={[styles.floatingBadge, { top: 30, left: 18 }]}>
        <Ionicons name="sparkles" size={16} color={colors.accent} />
        <AppText variant="caption">Novo no Mural</AppText>
      </View>
    </>
  );
}

function SearchArt() {
  const rows = [
    { initials: 'BF', name: 'Bolos da Fê', tone: CATEGORIES[2].tone, label: 'Gastronomia' },
    { initials: 'AL', name: 'Ateliê Luma', tone: CATEGORIES[1].tone, label: 'Moda' },
  ];
  return (
    <View style={styles.searchStack}>
      <View style={styles.searchPill}>
        <Ionicons name="search" size={18} color={colors.primary} />
        <AppText variant="body">bolo de festa</AppText>
        <View style={styles.cursor} />
      </View>
      {rows.map((row, index) => (
        <View key={row.name} style={[styles.resultCard, { marginLeft: index * 22 }]}>
          <View style={[styles.resultAvatar, { backgroundColor: row.tone.background }]}>
            <AppText variant="smallStrong" color={row.tone.foreground}>
              {row.initials}
            </AppText>
          </View>
          <View style={styles.resultTexts}>
            <AppText variant="subtitle">{row.name}</AppText>
            <View style={[styles.miniPill, { backgroundColor: row.tone.background }]}>
              <AppText variant="caption" color={row.tone.foreground}>
                {row.label}
              </AppText>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>
      ))}
    </View>
  );
}

function NetworkArt() {
  const people = CATEGORIES.slice(0, 6);
  const radiusPx = 112;
  return (
    <View style={styles.network}>
      {people.map((category, index) => {
        const angle = (index / people.length) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(angle) * radiusPx;
        const y = Math.sin(angle) * radiusPx;
        return (
          <Fragment key={category.slug}>
            <View
              style={[
                styles.line,
                {
                  width: radiusPx,
                  transform: [{ translateX: x / 2 - radiusPx / 2 }, { translateY: y / 2 }, { rotate: `${angle}rad` }],
                },
              ]}
            />
            <View
              style={[
                styles.node,
                { backgroundColor: category.tone.background, transform: [{ translateX: x }, { translateY: y }] },
              ]}
            >
              <Ionicons name={category.icon} size={22} color={category.tone.foreground} />
            </View>
          </Fragment>
        );
      })}
      <View style={styles.hub}>
        <BrandMark size={84} />
      </View>
    </View>
  );
}

const CARD_W = 180;
const CARD_H = 236;

const styles = StyleSheet.create({
  stage: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: palette.lilac50,
    borderWidth: 1,
    borderColor: palette.lilac100,
  },
  backCard: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
    borderRadius: radius.xxl,
    backgroundColor: palette.mist200,
  },
  frontCard: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.raised,
  },
  cardGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -90,
    right: -90,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  monogram: {
    fontFamily: fonts.display,
    fontSize: 56,
    lineHeight: 66,
    marginTop: -60,
  },
  cardFooter: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    gap: 2,
  },
  glassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 4,
  },
  floatingBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  searchStack: {
    width: 270,
    gap: spacing.sm,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    ...shadows.card,
  },
  cursor: {
    width: 2,
    height: 20,
    backgroundColor: colors.accent,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: 240,
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  resultAvatar: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTexts: {
    flex: 1,
    gap: 4,
  },
  miniPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  network: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    position: 'absolute',
    height: 2,
    left: 150,
    top: 149,
    backgroundColor: palette.lilac300,
    opacity: 0.6,
  },
  node: {
    position: 'absolute',
    left: 150 - 26,
    top: 150 - 26,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
    ...shadows.card,
  },
  hub: {
    borderRadius: radius.xl,
    ...shadows.raised,
  },
});
