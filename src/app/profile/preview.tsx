import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '@/components/feedback/toast-provider';
import { PreviewBanner } from '@/components/profiles/preview-banner';
import { profileToView, ProfileView } from '@/components/profiles/profile-view';
import { PublishBar } from '@/components/profiles/publish-bar';
import { IconButton } from '@/components/ui/icon-button';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states';
import { useMyProfile, useSetPublicationStatus } from '@/hooks/use-profiles';
import { getErrorMessage } from '@/utils/errors';

/** Prévia do próprio perfil, com publicação (e consentimento na primeira vez). */
export default function ProfilePreviewScreen() {
  const { publish: publishParam } = useLocalSearchParams<{ publish?: string }>();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { data: profile, isPending, isError, error, refetch } = useMyProfile();
  const setStatus = useSetPublicationStatus();
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState<string>();

  if (isPending) {
    return (
      <Screen safeTop={false}>
        <Skeleton height={280} borderRadius={0} />
      </Screen>
    );
  }
  if (isError) {
    return (
      <Screen>
        <ScreenHeader />
        <ErrorState error={error} onRetry={() => refetch()} />
      </Screen>
    );
  }
  if (!profile) {
    return (
      <Screen>
        <ScreenHeader />
        <EmptyState
          icon="storefront-outline"
          title="Nenhum perfil para mostrar"
          message="Crie seu perfil empresarial para ver a prévia."
          actionLabel="Criar perfil"
          onAction={() => router.replace('/profile/create')}
        />
      </Screen>
    );
  }

  const status = profile.publication_status;
  const canPublish = status === 'draft' || status === 'unpublished';
  const needsConsent = !profile.public_consent_at;

  const publish = async () => {
    if (needsConsent && !consent) {
      setConsentError('Para publicar, autorize a divulgação pública do seu perfil.');
      return;
    }
    try {
      await setStatus.mutateAsync({ profileId: profile.id, status: 'published', consent: needsConsent });
      toast.success('Seu perfil já aparece para todas as usuárias do Mural.', 'Publicado no Mural');
      if (router.canGoBack()) router.back();
    } catch (publishError) {
      toast.error(getErrorMessage(publishError));
    }
  };

  const bannerMessage =
    status === 'published'
      ? 'Seu perfil está publicado e é exatamente assim que aparece no Mural.'
      : status === 'suspended'
        ? 'Seu perfil está suspenso pela moderação e não aparece no Mural.'
        : publishParam
          ? 'Confira como o seu perfil vai aparecer e autorize a publicação.'
          : 'É assim que as outras pessoas verão o seu perfil quando ele estiver publicado.';

  return (
    <View style={styles.flex}>
      <ProfileView
        data={profileToView(profile)}
        topBar={
          <>
            <IconButton icon="chevron-back" variant="glass" accessibilityLabel="Voltar" onPress={() => router.back()} />
            <IconButton
              icon="create-outline"
              variant="glass"
              accessibilityLabel="Editar perfil"
              onPress={() => router.push('/profile/edit')}
            />
          </>
        }
        banner={<PreviewBanner message={bannerMessage} />}
        extraBottomSpace={canPublish ? 220 + insets.bottom : 0}
      />
      {canPublish ? (
        <PublishBar
          needsConsent={needsConsent}
          consent={consent}
          onConsentChange={(value) => {
            setConsent(value);
            if (value) setConsentError(undefined);
          }}
          consentError={consentError}
          onPublish={() => void publish()}
          publishing={setStatus.isPending}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
