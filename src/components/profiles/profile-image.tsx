import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, gradients, palette, radius } from '@/constants/theme';
import { useImageFallback } from '@/hooks/use-image-fallback';
import { getInitials } from '@/utils/format';

import { AppText } from '../ui/app-text';

type ProfileImageProps = {
  uri?: string | null;
  /** Nome usado nas iniciais quando não há imagem. */
  name: string;
  size: number;
  shape?: 'rounded' | 'circle';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/** Logotipo/foto quadrado ou circular, com monograma elegante como alternativa. */
export function ProfileImage({ uri: source, name, size, shape = 'rounded', style, accessibilityLabel }: ProfileImageProps) {
  const { uri, onError } = useImageFallback(source);
  const borderRadius = shape === 'circle' ? size / 2 : Math.min(radius.lg, size * 0.28);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? (uri ? `Imagem de ${name}` : `Monograma de ${name}`)}
      style={[styles.base, { width: size, height: size, borderRadius }, style]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          recyclingKey={uri}
          onError={onError}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fallback}>
          <View style={[styles.glow, { width: size * 0.9, height: size * 0.9, borderRadius: size }]} />
          <AppText
            style={{ fontFamily: fonts.display, fontSize: size * 0.36, lineHeight: size * 0.44 }}
            color={palette.white}
            maxFontSizeMultiplier={1}
          >
            {getInitials(name)}
          </AppText>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    backgroundColor: colors.surfaceSunken,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    top: '-30%',
    right: '-35%',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});
