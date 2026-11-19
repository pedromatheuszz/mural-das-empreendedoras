import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, MAX_CONTENT_WIDTH, radius, shadows, spacing } from '@/constants/theme';

import { AppText } from '../ui/app-text';
import { Button } from '../ui/button';
import { ConsentCheckbox } from './consent-checkbox';

type PublishBarProps = {
  /** Exibe o consentimento (necessário na primeira publicação). */
  needsConsent: boolean;
  consent: boolean;
  onConsentChange: (value: boolean) => void;
  consentError?: string;
  onPublish: () => void;
  onSaveDraft?: () => void;
  publishing?: boolean;
  savingDraft?: boolean;
};

/** Barra fixa da prévia: consentimento + publicar (ou salvar como rascunho). */
export function PublishBar({
  needsConsent,
  consent,
  onConsentChange,
  consentError,
  onPublish,
  onSaveDraft,
  publishing,
  savingDraft,
}: PublishBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <View style={styles.inner}>
        {needsConsent ? (
          <ConsentCheckbox checked={consent} onChange={onConsentChange} error={consentError} />
        ) : (
          <View style={styles.ready}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <AppText variant="small" color={colors.textSecondary} style={styles.flex}>
              Consentimento para divulgação já registrado.
            </AppText>
          </View>
        )}
        <Button
          title="Publicar no Mural"
          icon="rocket-outline"
          onPress={onPublish}
          loading={publishing}
          disabled={savingDraft}
          fullWidth
        />
        {onSaveDraft ? (
          <Button
            title="Salvar como rascunho"
            variant="ghost"
            size="md"
            onPress={onSaveDraft}
            loading={savingDraft}
            disabled={publishing}
            fullWidth
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    ...shadows.floating,
  },
  inner: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    gap: spacing.sm,
  },
  ready: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  flex: {
    flex: 1,
  },
});
