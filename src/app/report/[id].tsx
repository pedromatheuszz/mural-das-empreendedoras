import { zodResolver } from '@hookform/resolvers/zod';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useController, useForm, useFormState, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { useToast } from '@/components/feedback/toast-provider';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { FormTextField } from '@/components/ui/form-fields';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { LIMITS } from '@/constants/app';
import { colors, radius, spacing } from '@/constants/theme';
import { useReportProfile } from '@/hooks/use-profiles';
import { REPORT_REASONS, reportSchema, type ReportValues } from '@/schemas/report.schema';
import { getErrorMessage } from '@/utils/errors';
import { PRESS_SCALE } from '@/constants/motion';
import { PressableScale } from '@/components/ui/pressable-scale';

/** Denúncia de perfil (moderação do Mural). */
export default function ReportProfileScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const toast = useToast();
  const report = useReportProfile();
  const { control, handleSubmit } = useForm<ReportValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: { reason: undefined, details: '' },
    mode: 'onTouched',
  });
  const { isSubmitting } = useFormState({ control });
  const { field: reasonField, fieldState: reasonState } = useController({ control, name: 'reason' });
  const reason = useWatch({ control, name: 'reason' });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await report.mutateAsync({ profileId: id, reason: values.reason, details: values.details });
      toast.success('Nossa equipe vai analisar com cuidado. Obrigada por ajudar a manter o Mural seguro.', 'Denúncia enviada');
      router.back();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  return (
    <Screen scroll keyboardAware>
      <ScreenHeader title="Denunciar perfil" backIcon="close" />
      <View style={styles.intro}>
        <AppText variant="title" accessibilityRole="header">
          O que está acontecendo?
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          {name ? `Você está denunciando “${name}”. ` : ''}Sua denúncia é confidencial: a empreendedora não saberá quem
          denunciou.
        </AppText>
      </View>

      <View style={styles.options} accessibilityRole="radiogroup">
        {REPORT_REASONS.map((option) => {
          const selected = reasonField.value === option.value;
          return (
            <PressableScale
              key={option.value}
              onPress={() => {
                reasonField.onChange(option.value);
                reasonField.onBlur();
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${option.label}. ${option.description}`}
              scaleTo={PRESS_SCALE.card}
      style={[styles.option, selected ? styles.optionSelected : null]}
              pressedStyle={styles.pressed}
            >
              <Ionicons
                name={selected ? 'radio-button-on' : 'radio-button-off'}
                size={22}
                color={selected ? colors.primary : colors.textMuted}
              />
              <View style={styles.flex}>
                <AppText variant="bodyStrong">{option.label}</AppText>
                <AppText variant="small" color={colors.textSecondary}>
                  {option.description}
                </AppText>
              </View>
            </PressableScale>
          );
        })}
        {reasonState.error ? (
          <AppText variant="caption" color={colors.danger}>
            {reasonState.error.message}
          </AppText>
        ) : null}
      </View>

      <FormTextField
        control={control}
        name="details"
        label="Detalhes"
        optional={reason !== 'other'}
        helper="Conte o que aconteceu. Não inclua dados pessoais sensíveis."
        multiline
        maxLength={LIMITS.reportDetails.max}
        showCounter
      />

      <Button
        title="Enviar denúncia"
        icon="flag-outline"
        onPress={onSubmit}
        loading={isSubmitting}
        fullWidth
        style={styles.submit}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    gap: spacing.xs,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  options: {
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.accentSubtle,
  },
  pressed: {
    opacity: 0.85,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  submit: {
    marginTop: spacing.xl,
  },
});
