import type { ComponentRef, ReactNode, Ref, RefObject } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, MAX_CONTENT_WIDTH, spacing } from '@/constants/theme';

import { OfflineBanner } from './offline-banner';

/** Métodos de rolagem expostos para as telas (ex.: voltar ao topo ao trocar de etapa). */
export type ScrollHandle = { scrollTo: (options: { x?: number; y?: number; animated?: boolean }) => void };

type ScreenProps = {
  children: ReactNode;
  /** Conteúdo rolável (formulários e páginas longas). */
  scroll?: boolean;
  /** Mantém campos e rodapé visíveis acima do teclado. */
  keyboardAware?: boolean;
  /** Aplica a margem segura do topo (barra de status / notch). */
  safeTop?: boolean;
  /** Barra fixa no rodapé (ex.: botão "Salvar"). */
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  background?: string;
  scrollRef?: RefObject<ScrollHandle | null>;
  testID?: string;
};

export function Screen({
  children,
  scroll = false,
  keyboardAware = false,
  safeTop = true,
  footer,
  contentStyle,
  refreshControl,
  background = colors.background,
  scrollRef,
  testID,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = (footer ? spacing.lg : insets.bottom + spacing.xxl) as number;
  const contentContainerStyle = [styles.scrollContent, { paddingBottom: bottomPadding }, contentStyle];
  const inner = <View style={styles.inner}>{children}</View>;

  const body = scroll ? (
    <ScrollView
      ref={scrollRef as unknown as Ref<ComponentRef<typeof ScrollView>>}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={contentContainerStyle}
      refreshControl={refreshControl}
    >
      {inner}
    </ScrollView>
  ) : (
    <View style={[styles.fill, contentStyle]}>{children}</View>
  );

  const content = (
    <>
      <OfflineBanner />
      {body}
      {footer ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View style={styles.footerInner}>{footer}</View>
        </View>
      ) : null}
    </>
  );

  return (
    <View style={[styles.root, { backgroundColor: background, paddingTop: safeTop ? insets.top : 0 }]} testID={testID}>
      {keyboardAware ? (
        // Apps Expo são edge-to-edge no Android: a janela não encolhe com o teclado,
        // então o KeyboardAvoidingView (behavior "padding" nas duas plataformas) mantém
        // campos e o botão do rodapé visíveis acima do teclado. Compatível com o Expo Go.
        <KeyboardAvoidingView behavior="padding" style={styles.fill}>
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  inner: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderStrong,
  },
  footerInner: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    gap: spacing.xs,
  },
});
