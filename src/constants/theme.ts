import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/**
 * Identidade visual do Mural das Empreendedoras, nas cores do grupo Joinville Empreendedoras.
 * Paleta: roxo (identidade, a cor do grupo), lilás (destaque), branco lavanda (fundo),
 * névoa lilás (áreas secundárias) e grafite (textos).
 * Contrastes verificados para WCAG AA nas combinações de texto usadas no app.
 */
export const palette = {
  purple900: '#24043F',
  purple800: '#370661',
  purple700: '#491174',
  purple600: '#5E2A8A',
  purple100: '#EFE7F7',
  lilac600: '#7A4FA0',
  lilac500: '#9B72C4',
  lilac300: '#C9B2E3',
  lilac100: '#F1E9F8',
  lilac50: '#F8F4FC',
  paper: '#FBF9FD',
  mist100: '#F3EFF8',
  mist200: '#E7E0F0',
  mist300: '#D6CBE4',
  graphite900: '#232126',
  graphite700: '#3A373D',
  graphite500: '#5E5A60',
  graphite400: '#736C70',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const colors = {
  background: palette.paper,
  surface: palette.white,
  surfaceMuted: palette.mist100,
  surfaceSunken: palette.mist200,
  border: palette.mist200,
  borderStrong: palette.mist300,

  text: palette.graphite900,
  textSecondary: palette.graphite500,
  textMuted: palette.graphite400,
  textInverse: palette.white,

  primary: palette.purple700,
  primaryPressed: palette.purple800,
  primaryDeep: palette.purple900,
  primarySoft: palette.purple100,
  onPrimary: palette.white,

  accent: palette.lilac500,
  accentText: palette.lilac600,
  accentSoft: palette.lilac100,
  accentSubtle: palette.lilac50,

  success: '#2F7A57',
  successSoft: '#E6F2EC',
  warning: '#8F6210',
  warningSoft: '#FBF1DC',
  danger: '#B3261E',
  dangerSoft: '#FBE9E7',
  info: '#2F5E8E',
  infoSoft: '#E7EFF7',

  /** Brilhos decorativos em lilás (círculos de fundo, selos). */
  accentGlow: 'rgba(155, 114, 196, 0.18)',
  accentGlowStrong: 'rgba(155, 114, 196, 0.35)',
  /** Véu da barra de abas flutuante sobre o desfoque. */
  backgroundVeil: 'rgba(251, 249, 253, 0.95)',

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
      shadowColor: palette.purple900,
      shadowOpacity: 0.06,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
    },
    android: { elevation: 2 },
    default: { boxShadow: '0 6px 18px rgba(36, 4, 63, 0.07)' },
  }) as ViewStyle,
  raised: Platform.select<ViewStyle>({
    ios: {
      shadowColor: palette.purple900,
      shadowOpacity: 0.12,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
    },
    android: { elevation: 6 },
    default: { boxShadow: '0 10px 28px rgba(36, 4, 63, 0.14)' },
  }) as ViewStyle,
  floating: Platform.select<ViewStyle>({
    ios: {
      shadowColor: palette.purple900,
      shadowOpacity: 0.16,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: -2 },
    },
    android: { elevation: 12 },
    default: { boxShadow: '0 -4px 24px rgba(36, 4, 63, 0.10)' },
  }) as ViewStyle,
};

/** Gradientes de marca (usados em capas, splash e placeholders). */
export const gradients = {
  brand: [palette.purple700, palette.lilac500] as const,
  brandDeep: [palette.purple900, palette.purple700] as const,
  blush: [palette.lilac50, palette.mist100] as const,
  photoScrim: ['rgba(35,33,38,0)', 'rgba(35,33,38,0.25)', 'rgba(35,33,38,0.82)'] as const,
};

export const motion = {
  fast: 160,
  base: 240,
  slow: 380,
} as const;
