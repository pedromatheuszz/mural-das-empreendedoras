import { Text, type TextProps } from 'react-native';

import { colors, typography, type TypographyVariant } from '@/constants/theme';

export type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  color?: string;
  align?: 'left' | 'center' | 'right';
};

/** Texto padrão do app (tipografia da marca + suporte a fonte ampliada do sistema). */
export function AppText({
  variant = 'body',
  color = colors.text,
  align,
  style,
  maxFontSizeMultiplier = 1.6,
  ...rest
}: AppTextProps) {
  return (
    <Text
      {...rest}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[typography[variant], { color }, align ? { textAlign: align } : null, style]}
    />
  );
}
