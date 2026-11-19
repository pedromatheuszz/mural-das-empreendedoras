import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, gradients, palette } from '@/constants/theme';
import { useImageFallback } from '@/hooks/use-image-fallback';
import { getInitials } from '@/utils/format';

import { AppText } from './app-text';

type AvatarProps = {
  uri?: string | null;
  name: string;
  size?: number;
  /** Anel em rosa queimado ao redor da foto (destaque, como nos stories). */
  ring?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Avatar({ uri: source, name, size = 48, ring = false, style }: AvatarProps) {
  const { uri, onError } = useImageFallback(source);
  const inner = ring ? size - 8 : size;
  const content = uri ? (
    <Image
      source={{ uri }}
      onError={onError}
      style={{ width: inner, height: inner, borderRadius: inner / 2 }}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
      accessibilityIgnoresInvertColors
    />
  ) : (
    <LinearGradient
      colors={gradients.brand}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.fallback, { width: inner, height: inner, borderRadius: inner / 2 }]}
    >
      <AppText
        style={{ fontFamily: fonts.display, fontSize: inner * 0.38, lineHeight: inner * 0.46 }}
        color={palette.white}
        maxFontSizeMultiplier={1}
      >
        {getInitials(name)}
      </AppText>
    </LinearGradient>
  );

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={uri ? `Foto de ${name}` : `Iniciais de ${name}`}
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2 },
        ring ? styles.ring : null,
        style,
      ]}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ring: {
    borderWidth: 2.5,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
