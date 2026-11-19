import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useToast } from '@/components/feedback/toast-provider';
import { ProfileImage } from '@/components/profiles/profile-image';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/layout';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { colors, radius, spacing } from '@/constants/theme';
import { useMyProfileClaim, useRequestProfileClaim } from '@/hooks/use-claims';
import { useMyProfile, usePublicProfile } from '@/hooks/use-profiles';
import { getErrorMessage } from '@/utils/errors';

const STEPS = [
  'Você envia o pedido por aqui.',
  'A administração do grupo confere se o negócio é seu.',
  'Confirmado, o perfil aparece em Meu Perfil e você pode editá-lo.',
] as const;

/** Pedido para vincular um perfil do grupo (cadastrado pela organização) à conta logada. */
export default function ClaimProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = usePublicProfile(id);
  const myProfile = useMyProfile();
  const myClaim = useMyProfileClaim();
  const request = useRequestProfileClaim();
  const toast = useToast();
  const [note, setNote] = useState('');

  if (profile.isPending || myProfile.isPending || myClaim.isPending) {
    return (
      <Screen>
        <ScreenHeader title="Vincular perfil" />
        <View style={styles.loading}>
          <Skeleton height={96} borderRadius={radius.xl} />
          <Skeleton height={160} borderRadius={radius.xl} />
        </View>
      </Screen>
    );
  }

  const failure = profile.error ?? myProfile.error ?? myClaim.error;
  if (failure) {
    return (
      <Screen>
        <ScreenHeader title="Vincular perfil" />
        <ErrorState
          error={failure}
          onRetry={() => {
            void profile.refetch();
            void myProfile.refetch();
            void myClaim.refetch();
          }}
        />
      </Screen>
    );
  }

  const blocked = !profile.data
    ? { icon: 'search-outline' as const, title: 'Perfil não encontrado', message: 'Ele pode ter sido retirado do Mural.' }
    : profile.data.user_id !== null
      ? {
          icon: 'lock-closed-outline' as const,
          title: 'Este perfil já tem dona',
          message: 'Ele já está vinculado a uma conta. Se isso estiver errado, fale com a administração do grupo.',
        }
      : myProfile.data
        ? {
            icon: 'storefront-outline' as const,
            title: 'Sua conta já tem um perfil',
            message:
              'Cada conta tem um perfil no Mural. Para vincular este, exclua antes o perfil que você criou (Divulgar → Excluir perfil).',
          }
        : myClaim.data?.status === 'pending'
          ? {
              icon: 'hourglass-outline' as const,
              title: 'Você já tem um pedido em análise',
              message: `Seu pedido para “${myClaim.data.business_name}” está aguardando a administração. Você pode cancelá-lo em Meu Perfil.`,
            }
          : null;

  if (blocked || !profile.data) {
    return (
      <Screen>
        <ScreenHeader title="Vincular perfil" />
        <EmptyState
          icon={blocked?.icon ?? 'search-outline'}
          title={blocked?.title ?? 'Perfil não encontrado'}
          message={blocked?.message}
          actionLabel="Voltar"
          onAction={() => (router.canGoBack() ? router.back() : router.replace('/hub'))}
        />
      </Screen>
    );
  }

  const target = profile.data;
  const submit = async () => {
    try {
      await request.mutateAsync({ profileId: target.id, note });
      toast.success('A administração do grupo vai confirmar e você recebe o acesso em Meu Perfil.', 'Pedido enviado');
      router.replace('/me');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Screen
      scroll
      keyboardAware
      footer={<Button title="Enviar pedido" icon="send" onPress={submit} loading={request.isPending} fullWidth />}
    >
      <ScreenHeader title="Vincular perfil" />
      <View style={styles.sections}>
        <Card style={styles.summary}>
          <ProfileImage uri={target.logo_url} name={target.business_name} size={64} shape="circle" />
          <View style={styles.flex}>
            <AppText variant="subtitle" numberOfLines={2}>
              {target.business_name}
            </AppText>
            {target.instagram_url ? (
              <AppText variant="small" color={colors.textSecondary} numberOfLines={1}>
                {target.instagram_url.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@')}
              </AppText>
            ) : null}
          </View>
        </Card>

        <View style={styles.texts}>
          <AppText variant="heading" accessibilityRole="header">
            Este negócio é seu?
          </AppText>
          <AppText variant="body" color={colors.textSecondary}>
            Este perfil foi cadastrado pela organização do grupo. Ao vinculá-lo à sua conta, só você poderá editar as
            informações, e nenhuma outra conta terá acesso a ele.
          </AppText>
        </View>

        <View style={styles.steps}>
          {STEPS.map((step, index) => (
            <View key={step} style={styles.step}>
              <View style={styles.stepNumber}>
                <AppText variant="smallStrong" color={colors.primary}>
                  {index + 1}
                </AppText>
              </View>
              <AppText variant="small" style={styles.flex}>
                {step}
              </AppText>
            </View>
          ))}
        </View>

        <TextField
          label="Mensagem para a administração"
          optional
          helper="Ajuda a confirmar que o negócio é seu. Ex.: “Sou a Camila, dona da marca; meu Instagram pessoal é @...”."
          value={note}
          onChangeText={setNote}
          maxLength={500}
          multiline
          showCounter
        />

        <View style={styles.notice}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.textSecondary} />
          <AppText variant="caption" color={colors.textSecondary} style={styles.flex}>
            Pedidos falsos são recusados. A administração pode falar com você pelo Instagram do negócio antes de confirmar.
          </AppText>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  sections: {
    gap: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  texts: {
    gap: spacing.xs,
  },
  steps: {
    gap: spacing.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  flex: {
    flex: 1,
  },
});
