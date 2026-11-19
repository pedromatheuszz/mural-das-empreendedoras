import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';

import { AppText } from './app-text';
import { IconButton } from './icon-button';

type ScreenHeaderProps = {
  title?: string;
  /** Ação do botão voltar. Padrão: volta para a tela anterior. Use `false` para esconder. */
  onBack?: (() => void) | false;
  backIcon?: 'chevron-back' | 'close';
  right?: ReactNode;
};

/** Cabeçalho das telas internas: voltar + título + ação opcional. */
export function ScreenHeader({ title, onBack, backIcon = 'chevron-back', right }: ScreenHeaderProps) {
  const handleBack = () => {
    if (typeof onBack === 'function') onBack();
    else if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.side}>
        {onBack !== false ? (
          <IconButton
            icon={backIcon}
            accessibilityLabel={backIcon === 'close' ? 'Fechar' : 'Voltar'}
            onPress={handleBack}
            variant="surface"
          />
        ) : null}
      </View>
      <AppText variant="subtitle" numberOfLines={1} align="center" style={styles.title} accessibilityRole="header">
        {title ?? ''}
      </AppText>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
    backgroundColor: colors.background,
  },
  side: {
    minWidth: 44,
  },
  right: {
    alignItems: 'flex-end',
  },
  title: {
    flex: 1,
  },
});
