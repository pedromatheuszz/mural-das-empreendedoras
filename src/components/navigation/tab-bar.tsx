import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurTargetView, BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
  type RefObject,
} from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, gradients, MAX_CONTENT_WIDTH, palette, shadows, spacing } from '@/constants/theme';
import { useMyProfile } from '@/hooks/use-profiles';

import { AppText } from '../ui/app-text';
import { Avatar } from '../ui/avatar';

type IconName = keyof typeof Ionicons.glyphMap;

/** Altura da barra flutuante (sem a margem inferior). */
export const TAB_BAR_HEIGHT = 68;
const CENTER_SLOT = 84;

/** Espaço que as telas das abas reservam no fim da rolagem para a barra flutuante. */
export function useTabBarSpace(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + tabBarBottom(insets.bottom) + spacing.lg;
}

function tabBarBottom(insetBottom: number) {
  return Math.max(insetBottom, spacing.sm) + spacing.xs;
}

type TargetRef = RefObject<ComponentRef<typeof View> | null>;
type BlurRegistry = {
  targets: Map<string, TargetRef>;
  version: number;
  register: (routeKey: string, ref: TargetRef) => () => void;
};

/**
 * No Android, o desfoque precisa de uma referência ao conteúdo que fica atrás da barra
 * (e a barra não pode estar dentro dele). Cada tela das abas registra o seu conteúdo aqui.
 */
const BlurTargetContext = createContext<BlurRegistry | null>(null);

export function BlurTargetsProvider({ children }: { children: ReactNode }) {
  const [targets] = useState(() => new Map<string, TargetRef>());
  const [version, setVersion] = useState(0);
  const register = useCallback(
    (routeKey: string, ref: TargetRef) => {
      targets.set(routeKey, ref);
      setVersion((value) => value + 1);
      return () => {
        targets.delete(routeKey);
        setVersion((value) => value + 1);
      };
    },
    [targets],
  );
  return <BlurTargetContext.Provider value={{ targets, version, register }}>{children}</BlurTargetContext.Provider>;
}

/** Envolve o conteúdo de uma aba para que a barra flutuante possa desfocá-lo. */
export function ScreenBlurTarget({ routeKey, children }: { routeKey: string; children: ReactNode }) {
  const ref = useRef<ComponentRef<typeof View>>(null);
  const register = useContext(BlurTargetContext)?.register;
  useEffect(() => register?.(routeKey, ref), [register, routeKey]);
  return (
    <BlurTargetView ref={ref} style={styles.target}>
      {children}
    </BlurTargetView>
  );
}

const TABS: Record<string, { label: string; icon: IconName; activeIcon: IconName; hint: string }> = {
  hub: { label: 'Início', icon: 'home-outline', activeIcon: 'home', hint: 'Mural das Empreendedoras' },
  search: { label: 'Buscar', icon: 'search-outline', activeIcon: 'search', hint: 'Buscar empreendedoras' },
  publish: { label: 'Divulgar', icon: 'add', activeIcon: 'add', hint: 'Criar ou gerenciar seu perfil empresarial' },
  config: { label: 'Ajustes', icon: 'settings-outline', activeIcon: 'settings', hint: 'Configurações, segurança e privacidade' },
  me: { label: 'Meu Perfil', icon: 'person-outline', activeIcon: 'person', hint: 'Sua conta e configurações' },
};

/**
 * Barra de navegação flutuante, com fundo desfocado e o botão "Divulgar" no centro exato:
 * Início e Buscar ocupam a metade esquerda; Meu Perfil, a metade direita.
 */
export function TabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const { data: myProfile } = useMyProfile();
  const registry = useContext(BlurTargetContext);
  const focusedKey = state.routes[state.index]?.key;
  const blurTarget = focusedKey ? registry?.targets.get(focusedKey) : undefined;

  const routes = state.routes.filter((route) => TABS[route.name] && descriptors[route.key]);
  const center = routes.find((route) => route.name === 'publish');
  const sides = routes.filter((route) => route.name !== 'publish');
  const leftRoutes = sides.slice(0, Math.ceil(sides.length / 2));
  const rightRoutes = sides.filter((route) => !leftRoutes.includes(route));

  const renderTab = (route: (typeof routes)[number]) => {
    const meta = TABS[route.name];
    const index = state.routes.findIndex((item) => item.key === route.key);
    const focused = index === state.index;
    const tint = focused ? colors.primary : colors.textSecondary;

    const onPress = () => {
      Haptics.selectionAsync().catch(() => undefined);
      const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) navigateToTab(route.key);
    };

    if (route.name === 'publish') {
      return (
        <Pressable
          key={route.key}
          onPress={onPress}
          accessibilityRole="tab"
          accessibilityState={{ selected: focused }}
          accessibilityLabel={meta.label}
          accessibilityHint={meta.hint}
          style={({ pressed }) => [styles.centerSlot, pressed ? styles.pressed : null]}
        >
          <LinearGradient
            colors={focused ? [palette.wine800, palette.wine600] : gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.centerButton}
          >
            <Ionicons name="add" size={30} color={palette.white} />
          </LinearGradient>
          <AppText
            variant="caption"
            color={focused ? colors.primary : colors.textSecondary}
            style={focused ? styles.labelActive : null}
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}
          >
            {meta.label}
          </AppText>
        </Pressable>
      );
    }

    const icon =
      route.name === 'me' && myProfile?.profile_image_url ? (
        <Avatar uri={myProfile.profile_image_url} name={myProfile.entrepreneur_name} size={26} />
      ) : (
        <Ionicons name={focused ? meta.activeIcon : meta.icon} size={22} color={tint} />
      );

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={meta.label}
        accessibilityHint={meta.hint}
        style={({ pressed }) => [styles.item, pressed ? styles.pressed : null]}
      >
        <View style={[styles.pill, focused ? styles.pillActive : null]}>{icon}</View>
        <AppText
          variant="caption"
          color={tint}
          style={focused ? styles.labelActive : null}
          numberOfLines={1}
          maxFontSizeMultiplier={1.2}
        >
          {meta.label}
        </AppText>
      </Pressable>
    );
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.host, { bottom: tabBarBottom(insets.bottom) }]}
      accessibilityRole="tablist"
    >
      <View style={styles.shadow}>
        <View style={styles.bar}>
          <BlurView
            key={blurTarget ? focusedKey : 'no-target'}
            intensity={Platform.OS === 'ios' ? 60 : 40}
            tint="light"
            blurMethod={blurTarget ? 'dimezisBlurView' : 'none'}
            blurTarget={blurTarget ?? undefined}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, styles.veil]} />
          <View style={styles.half}>{leftRoutes.map(renderTab)}</View>
          <View style={styles.centerSpacer} />
          <View style={styles.half}>{rightRoutes.map(renderTab)}</View>
        </View>
        {center ? <View style={styles.centerHost}>{renderTab(center)}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  target: {
    flex: 1,
    backgroundColor: colors.background,
  },
  host: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    alignItems: 'center',
  },
  shadow: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    borderRadius: TAB_BAR_HEIGHT / 2,
    ...shadows.raised,
  },
  bar: {
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_HEIGHT / 2,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  veil: {
    // Véu claro sobre o desfoque: garante leitura dos ícones sobre qualquer conteúdo.
    backgroundColor: 'rgba(251,248,245,0.95)',
  },
  half: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  centerSpacer: {
    width: CENTER_SLOT,
  },
  centerHost: {
    position: 'absolute',
    top: -22,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  centerSlot: {
    width: CENTER_SLOT,
    alignItems: 'center',
    gap: 3,
  },
  centerButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.background,
    ...shadows.raised,
  },
  item: {
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 6,
  },
  pressed: {
    opacity: 0.7,
  },
  pill: {
    width: 52,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: 'rgba(194,112,111,0.18)',
  },
  labelActive: {
    fontFamily: fonts.bold,
  },
});
