import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useForm, useFormState } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { useToast } from '@/components/feedback/toast-provider';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/layout';
import { Screen, type ScrollHandle } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { spacing } from '@/constants/theme';
import { useConfirmDiscard } from '@/hooks/use-confirm-discard';
import {
  profileFormSchema,
  profileToFormValues,
  type ProfileFormOutput,
  type ProfileFormValues,
} from '@/schemas/profile.schema';
import type { EntrepreneurProfile } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';

import { IdentityFields, ImagesFields, LocationContactFields, ServicesFields } from './profile-form-fields';

type EditProfileFormProps = {
  profile: EntrepreneurProfile;
  /** Salva as alterações (a própria empreendedora ou a equipe do Mural). */
  onSave: (values: ProfileFormValues) => Promise<unknown>;
  saving: boolean;
  saved: boolean;
  title?: string;
  successMessage?: string;
  /** Aviso exibido acima do formulário (ex.: edição feita pela equipe). */
  notice?: ReactNode;
  /** Rota de retorno quando não há tela anterior. */
  fallbackRoute?: Href;
};

/** Formulário completo de edição do perfil empresarial. */
export function EditProfileForm({
  profile,
  onSave,
  saving,
  saved,
  title = 'Editar perfil',
  successMessage = 'As alterações já estão no seu perfil.',
  notice,
  fallbackRoute = '/publish',
}: EditProfileFormProps) {
  const { section } = useLocalSearchParams<{ section?: string }>();
  const toast = useToast();
  const scrollRef = useRef<ScrollHandle>(null);
  const [imagesOffset, setImagesOffset] = useState<number | null>(null);

  const { control, handleSubmit } = useForm<ProfileFormValues, unknown, ProfileFormOutput>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: profileToFormValues(profile),
    mode: 'onTouched',
  });
  const { isDirty } = useFormState({ control });
  const allowLeave = useConfirmDiscard(isDirty && !saving && !saved);

  useEffect(() => {
    // Atalho "Gerenciar imagens": rola direto para a seção de imagens.
    if (section === 'images' && imagesOffset !== null) {
      scrollRef.current?.scrollTo({ y: imagesOffset, animated: true });
    }
  }, [section, imagesOffset]);

  const save = handleSubmit(
    async (values) => {
      try {
        await onSave(values);
        allowLeave();
        toast.success(successMessage, 'Alterações salvas');
        if (router.canGoBack()) router.back();
        else router.replace(fallbackRoute);
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    () => toast.error('Revise os campos destacados antes de salvar.'),
  );

  return (
    <Screen
      scroll
      keyboardAware
      scrollRef={scrollRef}
      footer={
        <Button
          title="Salvar alterações"
          icon="checkmark"
          onPress={save}
          loading={saving}
          disabled={!isDirty}
          fullWidth
        />
      }
    >
      <ScreenHeader title={title} />
      {notice}
      <View style={styles.sections}>
        <View style={styles.section}>
          <SectionHeader eyebrow="Identidade" title="Sua marca" />
          <IdentityFields control={control} />
        </View>
        <View style={styles.section}>
          <SectionHeader eyebrow="Serviços" title="O que você oferece" />
          <ServicesFields control={control} />
        </View>
        <View style={styles.section} onLayout={(event) => setImagesOffset(event.nativeEvent.layout.y)}>
          <SectionHeader eyebrow="Imagens" title="Logotipo e foto" />
          <ImagesFields control={control} />
        </View>
        <View style={styles.section}>
          <SectionHeader eyebrow="Contato" title="Contato e localização" />
          <LocationContactFields control={control} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: {
    gap: spacing.xxl,
    marginTop: spacing.md,
  },
  section: {
    gap: spacing.lg,
  },
});
