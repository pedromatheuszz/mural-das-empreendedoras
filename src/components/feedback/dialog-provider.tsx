import Ionicons from '@expo/vector-icons/Ionicons';
import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { DIALOG_ENTER } from '@/constants/motion';
import { colors, radius, shadows, spacing } from '@/constants/theme';

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
};

type DialogApi = {
  /** Abre um diálogo de confirmação e resolve com true (confirmou) ou false (cancelou). */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const DialogContext = createContext<DialogApi | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const close = (result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setDialog(null);
  };

  const api: DialogApi = {
    confirm: (options) =>
      new Promise<boolean>((resolve) => {
        resolver.current?.(false);
        resolver.current = resolve;
        setDialog(options);
      }),
  };

  const destructive = dialog?.destructive ?? false;

  return (
    <DialogContext.Provider value={api}>
      {children}
      <Modal
        visible={dialog !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => close(false)}
      >
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => close(false)} accessibilityLabel="Fechar" />
          {dialog ? (
            <Animated.View entering={DIALOG_ENTER} style={styles.card} accessibilityViewIsModal accessibilityRole="alert">
              <View style={[styles.iconWrap, destructive && styles.iconWrapDanger]}>
                <Ionicons
                  name={dialog.icon ?? (destructive ? 'warning-outline' : 'help-circle-outline')}
                  size={26}
                  color={destructive ? colors.danger : colors.primary}
                />
              </View>
              <AppText variant="heading" align="center">
                {dialog.title}
              </AppText>
              {dialog.message ? (
                <AppText variant="body" color={colors.textSecondary} align="center">
                  {dialog.message}
                </AppText>
              ) : null}
              <View style={styles.actions}>
                <Button
                  title={dialog.confirmLabel ?? 'Confirmar'}
                  variant={destructive ? 'danger' : 'primary'}
                  onPress={() => close(true)}
                  fullWidth
                />
                <Button title={dialog.cancelLabel ?? 'Cancelar'} variant="ghost" onPress={() => close(false)} fullWidth />
              </View>
            </Animated.View>
          ) : null}
        </View>
      </Modal>
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogApi {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useDialog precisa estar dentro de <DialogProvider>.');
  return context;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
    alignItems: 'stretch',
    ...shadows.raised,
  },
  iconWrap: {
    alignSelf: 'center',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxs,
  },
  iconWrapDanger: {
    backgroundColor: colors.dangerSoft,
  },
  actions: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
});
