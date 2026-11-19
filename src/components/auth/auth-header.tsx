import { StyleSheet, View } from 'react-native';

import { APP_NAME } from '@/constants/app';
import { colors, palette, spacing } from '@/constants/theme';

import { AppText } from '../ui/app-text';
import { BrandMark } from '../ui/brand-mark';

/** Cabeçalho das telas de acesso: símbolo da marca, título e subtítulo. */
export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.blobLarge} pointerEvents="none" />
      <View style={styles.blobSmall} pointerEvents="none" />
      <BrandMark size={52} />
      <AppText variant="eyebrow" color={colors.accentText} style={styles.eyebrow}>
        {APP_NAME}
      </AppText>
      <AppText variant="display" accessibilityRole="header">
        {title}
      </AppText>
      <AppText variant="body" color={colors.textSecondary}>
        {subtitle}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
    paddingTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  eyebrow: {
    marginTop: spacing.md,
  },
  blobLarge: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    top: -150,
    right: -120,
    backgroundColor: palette.lilac100,
    opacity: 0.8,
  },
  blobSmall: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    top: 30,
    right: 20,
    backgroundColor: palette.mist100,
  },
});
