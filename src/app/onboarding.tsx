import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingArt, type OnboardingArtVariant } from '@/components/onboarding/onboarding-art';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { TextLink } from '@/components/ui/text-link';
import { colors, MAX_CONTENT_WIDTH, spacing } from '@/constants/theme';
import { useOnboarding } from '@/providers/onboarding-provider';

type Slide = { key: string; eyebrow: string; title: string; text: string; art: OnboardingArtVariant };

const SLIDES: Slide[] = [
  {
    key: 'visibility',
    eyebrow: 'Visibilidade',
    title: 'Sua marca merece ser vista',
    text: 'Crie um perfil profissional para o seu negócio e apresente seus serviços para novas clientes.',
    art: 'cards',
  },
  {
    key: 'discovery',
    eyebrow: 'Descoberta',
    title: 'Seja encontrada por quem procura',
    text: 'As pessoas buscam por marca, nome ou serviço — e chegam até você com um toque.',
    art: 'search',
  },
  {
    key: 'network',
    eyebrow: 'Conexão',
    title: 'Uma rede que cresce junto',
    text: 'Conecte-se com outras empreendedoras, troque indicações e ofereça cortesias para quem faz parte do Mural.',
    art: 'network',
  },
];

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { complete } = useOnboarding();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const finish = async (destination: '/sign-up' | '/sign-in') => {
    await complete();
    router.replace(destination);
  };

  const next = () => {
    if (isLast) return finish('/sign-up');
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.md }]}>
      <View style={styles.topBar}>
        {!isLast ? <TextLink label="Pular" onPress={() => finish('/sign-in')} accessibilityHint="Vai para o login" /> : null}
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={32}
        onScroll={(event) => {
          const next = Math.round(event.nativeEvent.contentOffset.x / Math.max(width, 1));
          if (next !== index && next >= 0 && next < SLIDES.length) setIndex(next);
        }}
        getItemLayout={(_, itemIndex) => ({ length: width, offset: width * itemIndex, index: itemIndex })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <OnboardingArt variant={item.art} />
            <View style={styles.texts}>
              <AppText variant="eyebrow" color={colors.accentText} align="center">
                {item.eyebrow}
              </AppText>
              <AppText variant="display" align="center" accessibilityRole="header">
                {item.title}
              </AppText>
              <AppText variant="body" color={colors.textSecondary} align="center">
                {item.text}
              </AppText>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots} accessibilityLabel={`Passo ${index + 1} de ${SLIDES.length}`}>
          {SLIDES.map((slide, slideIndex) => (
            <Dot key={slide.key} active={slideIndex === index} />
          ))}
        </View>
        <Button
          title={isLast ? 'Criar minha conta' : 'Continuar'}
          icon={isLast ? undefined : 'arrow-forward'}
          iconPosition="right"
          onPress={next}
          fullWidth
        />
        {isLast ? <Button title="Já tenho conta" variant="ghost" onPress={() => finish('/sign-in')} fullWidth /> : null}
      </View>
    </View>
  );
}

function Dot({ active }: { active: boolean }) {
  const style = useAnimatedStyle(() => ({
    width: withTiming(active ? 26 : 8, { duration: 220 }),
    backgroundColor: withTiming(active ? colors.primary : colors.borderStrong, { duration: 220 }),
  }));
  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    height: 44,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  texts: {
    gap: spacing.sm,
    maxWidth: 420,
  },
  footer: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
