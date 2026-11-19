import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/**
 * Identidade visual do Mural das Empreendedoras.
 * Paleta: rosa queimado (destaque), vinho/bordô (identidade), off-white (fundo),
 * bege claro (áreas secundárias) e grafite (textos).
 * Contrastes verificados para WCAG AA nas combinações de texto usadas no app.
 */
export const palette = {
  wine900: '#3E0F22',
  wine800: '#561733',
  wine700: '#6B1D3A',
  wine600: '#7F2A48',
  wine100: '#F3E4E9',
  rose600: '#A3505A',
  rose500: '#C2706F',
  rose300: '#E2A9A3',
  rose100: '#F6E3DF',
  rose50: '#FBF0EE',
  cream: '#FBF8F5',
  beige100: '#F4ECE4',
  beige200: '#EADFD3',
  beige300: '#DCCBBB',
  graphite900: '#232126',
  graphite700: '#3A373D',
  graphite500: '#5E5A60',
  graphite400: '#736C70',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const colors = {
  background: palette.cream,
  surface: palette.white,
  surfaceMuted: palette.beige100,
  surfaceSunken: palette.beige200,
  border: palette.beige200,
  borderStrong: palette.beige300,

  text: palette.graphite900,
  textSecondary: palette.graphite500,
  textMuted: palette.graphite400,
  textInverse: palette.white,

  primary: palette.wine700,
  primaryPressed: palette.wine800,
  primaryDeep: palette.wine900,
  primarySoft: palette.wine100,
  onPrimary: palette.white,

  accent: palette.rose500,
  accentText: palette.rose600,
  accentSoft: palette.rose100,
  accentSubtle: palette.rose50,

  success: '#2F7A57',
  successSoft: '#E6F2EC',
  warning: '#8F6210',
  warningSoft: '#FBF1DC',
  danger: '#B3261E',
  dangerSoft: '#FBE9E7',
  info: '#2F5E8E',
  infoSoft: '#E7EFF7',

  overlay: 'rgba(35, 33, 38, 0.45)',
  scrim: 'rgba(35, 33, 38, 0.55)',
} as const;

export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  xxl: 32,
  pill: 999,
} as const;

/** Largura máxima do conteúdo em telas grandes (tablets e web). */
export const MAX_CONTENT_WIDTH = 640;

export type TypographyVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'subtitle'
  | 'body'
  | 'bodyStrong'
  | 'small'
  | 'smallStrong'
  | 'caption'
  | 'eyebrow'
  | 'button';

export const typography: Record<TypographyVariant, TextStyle> = {
  display: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, letterSpacing: -0.4 },
  title: { fontFamily: fonts.display, fontSize: 26, lineHeight: 32, letterSpacing: -0.3 },
  heading: { fontFamily: fonts.display, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  subtitle: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 23 },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  smallStrong: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 19 },
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  button: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20 },
};

export const shadows: Record<'card' | 'raised' | 'floating', ViewStyle> = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: palette.wine900,
      shadowOpacity: 0.06,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
    },
    android: { elevation: 2 },
    default: { boxShadow: '0 6px 18px rgba(62, 15, 34, 0.07)' },
  }) as ViewStyle,
  raised: Platform.select<ViewStyle>({
    ios: {
      shadowColor: palette.wine900,
      shadowOpacity: 0.12,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
    },
    android: { elevation: 6 },
    default: { boxShadow: '0 10px 28px rgba(62, 15, 34, 0.14)' },
  }) as ViewStyle,
  floating: Platform.select<ViewStyle>({
    ios: {
      shadowColor: palette.wine900,
      shadowOpacity: 0.16,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: -2 },
    },
    android: { elevation: 12 },
    default: { boxShadow: '0 -4px 24px rgba(62, 15, 34, 0.10)' },
  }) as ViewStyle,
};

/** Gradientes de marca (usados em capas, splash e placeholders). */
export const gradients = {
  brand: [palette.wine700, palette.rose500] as const,
  brandDeep: [palette.wine900, palette.wine700] as const,
  blush: [palette.rose50, palette.beige100] as const,
  photoScrim: ['rgba(35,33,38,0)', 'rgba(35,33,38,0.25)', 'rgba(35,33,38,0.82)'] as const,
};

export const motion = {
  fast: 160,
  base: 240,
  slow: 380,
} as const;
