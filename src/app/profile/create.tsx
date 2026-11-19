import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useForm, useFormState, type FieldErrors } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '@/components/feedback/toast-provider';
import {
  IdentityFields,
  ImagesFields,
  LocationContactFields,
  ServicesFields,
} from '@/components/profiles/profile-form-fields';
import { formValuesToView, ProfileView } from '@/components/profiles/profile-view';
import { PreviewBanner } from '@/components/profiles/preview-banner';
import { PublishBar } from '@/components/profiles/publish-bar';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { ProgressBar } from '@/components/ui/layout';
import { Screen, type ScrollHandle } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { colors, spacing } from '@/constants/theme';
import { useAccount } from '@/hooks/use-account';
import { useConfirmDiscard } from '@/hooks/use-confirm-discard';
import { useCreateProfile, useMyProfile } from '@/hooks/use-profiles';
import {
  emptyProfileForm,
  PROFILE_STEPS,
  profileFormSchema,
  type ProfileFormOutput,
  type ProfileFormValues,
} from '@/schemas/profile.schema';
import { getErrorMessage } from '@/utils/errors';

const STEP_FIELDS = [IdentityFields, ServicesFields, ImagesFields, LocationContactFields];
const TOTAL_STEPS = PROFILE_STEPS.length + 1; // + prévia

/** Cadastro guiado do perfil empresarial: 4 etapas + prévia antes de publicar. */
export default function CreateProfileScreen() {
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const account = useAccount();
  const myProfile = useMyProfile();
  const create = useCreateProfile();
  const scrollRef = useRef<ScrollHandle>(null);
  const [step, setStep] = useState(0);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState<string>();
  const [pendingAction, setPendingAction] = useState<'publish' | 'draft' | null>(null);

  const { control, trigger, getValues, setValue, getFieldState } = useForm<ProfileFormValues, unknown, ProfileFormOutput>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: emptyProfileForm(),
    mode: 'onTouched',
  });
  const { isDirty } = useFormState({ control });
  const allowLeave = useConfirmDiscard(isDirty && !create.isSuccess);

  const accountName = account.data?.full_name;
  useEffect(() => {
    // Sugere o nome da conta como nome da empreendedora responsável.
    if (accountName && !getFieldState('entrepreneurName').isDirty && !getValues('entrepreneurName')) {
      setValue('entrepreneurName', accountName);
    }
  }, [accountName, getFieldState, getValues, setValue]);

  const checkedExisting = useRef(false);
  useEffect(() => {
    // Cada conta tem um perfil empresarial (MVP): se ao abrir a tela ele já existe, vai para a edição.
    // A verificação acontece uma única vez, para não interferir após a criação.
    if (checkedExisting.current || !myProfile.isSuccess) return;
    checkedExisting.current = true;
    if (myProfile.data) router.replace('/profile/edit');
  }, [myProfile.isSuccess, myProfile.data]);

  const isPreview = step === PROFILE_STEPS.length;

  const goTo = (target: number) => {
    setStep(target);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const next = async () => {
    const valid = await trigger(PROFILE_STEPS[step].fields, { shouldFocus: true });
    if (!valid) {
      toast.error('Revise os campos destacados para continuar.');
      return;
    }
    goTo(step + 1);
  };

  const firstStepWithError = (errors: FieldErrors<ProfileFormValues>) =>
    PROFILE_STEPS.findIndex((item) => item.fields.some((field) => errors[field]));

  const submit = async (publish: boolean) => {
    if (publish && !consent) {
      setConsentError('Para publicar, autorize a divulgação pública do seu perfil.');
      return;
    }
    const valid = await trigger();
    if (!valid) {
      const errors = PROFILE_STEPS.flatMap((item) => item.fields).reduce<FieldErrors<ProfileFormValues>>(
        (acc, field) => {
          const { error } = getFieldState(field);
          return error ? { ...acc, [field]: error } : acc;
        },
        {},
      );
      goTo(Math.max(firstStepWithError(errors), 0));
      toast.error('Algumas informações precisam de ajuste antes de salvar.');
      return;
    }
    setPendingAction(publish ? 'publish' : 'draft');
    try {
      await create.mutateAsync({ values: getValues(), publish });
      allowLeave();
      toast.success(
        publish ? 'Seu perfil já aparece para todas as usuárias do Mural.' : 'Publique quando quiser pela aba Divulgar.',
        publish ? 'Perfil publicado!' : 'Rascunho salvo',
      );
      router.navigate('/publish');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  };

  if (isPreview) {
    return (
      <View style={styles.flex}>
        <ProfileView
          data={formValuesToView(getValues())}
          topBar={
            <IconButton icon="chevron-back" variant="glass" accessibilityLabel="Voltar e editar" onPress={() => goTo(step - 1)} />
          }
          banner={<PreviewBanner message="É assim que as outras pessoas vão ver o seu perfil no Mural." />}
          extraBottomSpace={260 + insets.bottom}
        />
        <PublishBar
          needsConsent
          consent={consent}
          onConsentChange={(value) => {
            setConsent(value);
            if (value) setConsentError(undefined);
          }}
          consentError={consentError}
          onPublish={() => void submit(true)}
          onSaveDraft={() => void submit(false)}
          publishing={pendingAction === 'publish'}
          savingDraft={pendingAction === 'draft'}
        />
      </View>
    );
  }

  const StepFields = STEP_FIELDS[step];
  const current = PROFILE_STEPS[step];

  return (
    <Screen
      scroll
      keyboardAware
      scrollRef={scrollRef}
      footer={
        <View style={styles.footerRow}>
          {step > 0 ? (
            <Button title="Voltar" variant="secondary" onPress={() => goTo(step - 1)} style={styles.flex} fullWidth />
          ) : null}
          <Button
            title={step === PROFILE_STEPS.length - 1 ? 'Ver prévia' : 'Continuar'}
            icon={step === PROFILE_STEPS.length - 1 ? 'eye-outline' : 'arrow-forward'}
            iconPosition="right"
            onPress={() => void next()}
            style={styles.flex2}
            fullWidth
          />
        </View>
      }
    >
      <ScreenHeader title="Criar perfil empresarial" backIcon="close" onBack={() => router.back()} />
      <View style={styles.progress}>
        <ProgressBar progress={(step + 1) / TOTAL_STEPS} label={`Etapa ${step + 1} de ${TOTAL_STEPS}`} />
      </View>
      <Animated.View key={step} entering={FadeInRight.duration(260)} style={styles.stepBody}>
        <View style={styles.stepHeader}>
          <AppText variant="eyebrow" color={colors.accentText}>
            Etapa {step + 1} de {TOTAL_STEPS}
          </AppText>
          <AppText variant="title" accessibilityRole="header">
            {current.title}
          </AppText>
          <AppText variant="body" color={colors.textSecondary}>
            {current.subtitle}
          </AppText>
        </View>
        <StepFields control={control} />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  progress: {
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  stepBody: {
    gap: spacing.xl,
  },
  stepHeader: {
    gap: spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
