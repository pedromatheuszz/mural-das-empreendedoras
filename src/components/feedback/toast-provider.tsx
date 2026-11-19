import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { AppText } from '@/components/ui/app-text';
import { EASE_OUT, TOAST_ENTER, TOAST_EXIT } from '@/constants/motion';
import { MAX_CONTENT_WIDTH, palette, radius, shadows, spacing } from '@/constants/theme';

type ToastType = 'success' | 'error' | 'info';

type ToastOptions = {
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
};

type ToastApi = {
  show: (options: ToastOptions) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const TONES: Record<ToastType, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  success: { icon: 'checkmark-circle', color: '#8FD8B1' },
  error: { icon: 'alert-circle', color: '#FFA79E' },
  info: { icon: 'information-circle', color: palette.lilac300 },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const show = (options: ToastOptions) => {
    if (timer.current) clearTimeout(timer.current);
    const id = Date.now();
    setToast({ ...options, id });
    AccessibilityInfo.announceForAccessibility([options.title, options.message].filter(Boolean).join('. '));
    if (options.type === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    } else if (options.type === 'error') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
    }
    const duration = options.duration ?? (options.type === 'error' ? 4500 : 3200);
    timer.current = setTimeout(() => setToast((current) => (current?.id === id ? null : current)), duration);
  };

  const api: ToastApi = {
    show,
    success: (message, title) => show({ type: 'success', message, title }),
    error: (message, title) => show({ type: 'error', message, title }),
    info: (message, title) => show({ type: 'info', message, title }),
  };

  const tone = TONES[toast?.type ?? 'info'];

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast ? (
        <View pointerEvents="box-none" style={[styles.host, { top: insets.top + spacing.xs }]}>
          <Animated.View key={toast.id} entering={TOAST_ENTER} exiting={TOAST_EXIT} style={styles.wrapper}>
            <SwipeToDismiss onDismiss={() => setToast(null)}>
              <Pressable
                onPress={() => setToast(null)}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                accessibilityHint="Toque ou deslize para cima para fechar"
                style={styles.toast}
              >
                <Ionicons name={tone.icon} size={22} color={tone.color} />
                <View style={styles.texts}>
                  {toast.title ? (
                    <AppText variant="smallStrong" color={palette.white}>
                      {toast.title}
                    </AppText>
                  ) : null}
                  <AppText variant="small" color="rgba(255,255,255,0.88)">
                    {toast.message}
                  </AppText>
                </View>
              </Pressable>
            </SwipeToDismiss>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

/**
 * Arrastar o aviso para cima o dispensa: segue o dedo, basta uma "puxada" rápida ou ~28 pt,
 * e se soltar antes volta ao lugar com mola (carregando a velocidade do gesto).
 */
function SwipeToDismiss({ children, onDismiss }: { children: ReactNode; onDismiss: () => void }) {
  const translateY = useSharedValue(0);
  const pan = Gesture.Pan()
    .activeOffsetY([-8, 8])
    .onUpdate((event) => {
      // Para baixo há resistência (elástico); para cima, segue o dedo.
      translateY.set(event.translationY < 0 ? event.translationY : event.translationY * 0.2);
    })
    .onEnd((event) => {
      if (event.translationY < -28 || event.velocityY < -500) {
        translateY.set(withTiming(-160, { duration: 180, easing: EASE_OUT }));
        scheduleOnRN(onDismiss);
      } else {
        translateY.set(withSpring(0, { duration: 400, dampingRatio: 0.8, velocity: event.velocityY }));
      }
    });
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.get() }] }));
  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={style}>{children}</Animated.View>
    </GestureDetector>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast precisa estar dentro de <ToastProvider>.');
  return context;
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    alignItems: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
  wrapper: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH - spacing.xxl,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: palette.graphite900,
    ...shadows.raised,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
});
