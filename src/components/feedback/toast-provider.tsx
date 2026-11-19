import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
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
  info: { icon: 'information-circle', color: palette.rose300 },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

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
          <Animated.View key={toast.id} entering={FadeInUp.duration(260)} exiting={FadeOutUp.duration(200)} style={styles.wrapper}>
            <Pressable
              onPress={() => setToast(null)}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              accessibilityHint="Toque para fechar"
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
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
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
