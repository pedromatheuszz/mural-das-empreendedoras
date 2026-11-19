import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useToast } from '@/components/feedback/toast-provider';
import { colors, radius, spacing } from '@/constants/theme';
import { optimizeImage, type ImageKind } from '@/services/storage.service';

import { AppText } from '../ui/app-text';
import { Button } from '../ui/button';
import { ProfileImage } from './profile-image';
import { PRESS_SCALE } from '@/constants/motion';
import { PressableScale } from '../ui/pressable-scale';

type ImagePickerFieldProps = {
  kind: ImageKind;
  label: string;
  helper: string;
  value: string | null;
  onChange: (uri: string | null) => void;
  /** Nome usado no monograma quando não há imagem. */
  name: string;
};

const PREVIEW_SIZE = 96;

export function ImagePickerField({ kind, label, helper, value, onChange, name }: ImagePickerFieldProps) {
  const toast = useToast();
  const [processing, setProcessing] = useState(false);

  const pick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        shape: kind === 'photo' ? 'oval' : 'rectangle',
        quality: 1,
      });
      if (result.canceled || !result.assets[0]) return;
      setProcessing(true);
      const asset = result.assets[0];
      const optimized = await optimizeImage(asset.uri, kind, asset.width);
      onChange(optimized);
    } catch {
      toast.error('Não foi possível usar esta imagem. Tente outra, nos formatos JPG ou PNG.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <PressableScale
        onPress={pick}
        disabled={processing}
        accessibilityRole="button"
        accessibilityLabel={value ? `Trocar ${label.toLowerCase()}` : `Adicionar ${label.toLowerCase()}`}
        scaleTo={PRESS_SCALE.card}
      pressedStyle={styles.pressed}
      >
        {value ? (
          <ProfileImage uri={value} name={name} size={PREVIEW_SIZE} shape={kind === 'photo' ? 'circle' : 'rounded'} />
        ) : (
          <View
            style={[
              styles.placeholder,
              { borderRadius: kind === 'photo' ? PREVIEW_SIZE / 2 : radius.lg },
            ]}
          >
            <Ionicons name={kind === 'photo' ? 'person-add-outline' : 'image-outline'} size={28} color={colors.accentText} />
          </View>
        )}
        {processing ? (
          <View style={[styles.loading, { borderRadius: kind === 'photo' ? PREVIEW_SIZE / 2 : radius.lg }]}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}
      </PressableScale>
      <View style={styles.texts}>
        <AppText variant="bodyStrong">
          {label}{' '}
          <AppText variant="small" color={colors.textMuted}>
            (opcional)
          </AppText>
        </AppText>
        <AppText variant="small" color={colors.textSecondary}>
          {helper}
        </AppText>
        <View style={styles.actions}>
          <Button
            title={value ? 'Trocar' : 'Escolher imagem'}
            icon={value ? 'swap-horizontal-outline' : 'add'}
            size="sm"
            variant="soft"
            onPress={pick}
            disabled={processing}
          />
          {value ? (
            <Button
              title="Remover"
              size="sm"
              variant="dangerGhost"
              onPress={() => onChange(null)}
              disabled={processing}
              accessibilityLabel={`Remover ${label.toLowerCase()}`}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.85,
  },
  placeholder: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSubtle,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.accent,
  },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  texts: {
    flex: 1,
    gap: 4,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
});
