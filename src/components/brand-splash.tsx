import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';

import { APP_NAME } from '@/constants/app';
import { palette, spacing, colors } from '@/constants/theme';

import { AppText } from './ui/app-text';
import { BrandMark } from './ui/brand-mark';

const MIN_DURATION = 900;

/**
 * Splash animada: continua a splash nativa (mesmo fundo roxo e símbolo) e some
 * suavemente quando fontes e sessão estão prontas.
 */
export function BrandSplash({ ready, fontsReady }: { ready: boolean; fontsReady: boolean }) {
  const [minElapsed, setMinElapsed] = useState(false);
  const hidden = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), MIN_DURATION);
    return () => clearTimeout(timer);
  }, []);

  // Some com animação de saída (exiting) quando tudo estiver pronto.
  if (ready && minElapsed) return null;

  return (
    <Animated.View
      exiting={FadeOut.duration(350)}
      style={styles.overlay}
      onLayout={() => {
        if (hidden.current) return;
        hidden.current = true;
        SplashScreen.hideAsync().catch(() => undefined);
      }}
      accessibilityLabel={`${APP_NAME} carregando`}
    >
      <LinearGradient colors={[palette.purple700, palette.purple800]} start={{ x: 0.5, y: 0.3 }} end={{ x: 1, y: 1 }} style={styles.fill}>
        <View style={styles.glow} />
        <Animated.View entering={ZoomIn.duration(500).easing(Easing.out(Easing.cubic))}>
          <BrandMark variant="plain" size={104} />
        </Animated.View>
        {fontsReady ? (
          <Animated.View entering={FadeIn.delay(150).duration(450)} style={styles.texts}>
            <AppText variant="title" color={palette.paper} align="center">
              {APP_NAME}
            </AppText>
            <AppText variant="eyebrow" color={palette.lilac300} align="center">
              Conecte · Divulgue · Cresça
            </AppText>
          </Animated.View>
        ) : null}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 2000,
    elevation: 2000,
  },
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  glow: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
    top: -160,
    right: -160,
    backgroundColor: colors.accentGlow,
  },
  texts: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
  },
});
