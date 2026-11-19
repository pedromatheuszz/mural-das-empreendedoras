import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius } from '@/constants/theme';

type BrandMarkProps = {
  size?: number;
  /** "tile": símbolo em um quadrado vinho; "plain": só o símbolo (para fundos vinho). */
  variant?: 'tile' | 'plain';
  style?: StyleProp<ViewStyle>;
};

const MARK = require('@/assets/images/brand-mark.png');

export function BrandMark({ size = 56, variant = 'tile', style }: BrandMarkProps) {
  const image = (
    <Image
      source={MARK}
      style={{ width: variant === 'tile' ? size * 0.72 : size, height: variant === 'tile' ? size * 0.72 : size }}
      contentFit="contain"
      accessibilityIgnoresInvertColors
    />
  );
  if (variant === 'plain') {
    return (
      <View style={style} accessible accessibilityRole="image" accessibilityLabel="Mural das Empreendedoras">
        {image}
      </View>
    );
  }
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Mural das Empreendedoras"
      style={[styles.tile, { width: size, height: size, borderRadius: Math.min(radius.xl, size * 0.3) }, style]}
    >
      {image}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
