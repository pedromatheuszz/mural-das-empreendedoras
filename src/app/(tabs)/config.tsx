import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useDialog } from '@/components/feedback/dialog-provider';
import { useToast } from '@/components/feedback/toast-provider';
import { useDeleteProfileAction } from '@/components/profiles/publication-panel';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/layout';
import { ListGroup, ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { useTabBarSpace } from '@/components/navigation/tab-bar';
import { APP_NAME, APP_VERSION, LEGAL_ENTITY } from '@/constants/app';
import { colors, spacing } from '@/constants/theme';
import { useMyProfile } from '@/hooks/use-profiles';
import { signOut } from '@/services/auth.service';
import { getErrorMessage } from '@/utils/errors';

/** Configurações: segurança, privacidade e gerenciamento da conta. */
export default function SettingsScreen() {
  const tabBarSpace = useTabBarSpace();
  const dialog = useDialog();
  const toast = useToast();
  const { data: profile } = useMyProfile();
  const { remove } = useDeleteProfileAction();

  const signOutEverywhere = async () => {
    const confirmed = await dialog.confirm({
      title: 'Sair de todos os aparelhos?',
      message: 'Sua conta será desconectada em todos os celulares e navegadores, inclusive neste.',
      confirmLabel: 'Sair de todos',
      icon: 'phone-portrait-outline',
    });
    if (!confirmed) return;
    try {
      await signOut();
      toast.info('Você saiu da conta em todos os aparelhos.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Screen scroll contentStyle={{ paddingBottom: tabBarSpace }}>
      <View style={styles.header}>
        <AppText variant="eyebrow" color={colors.accentText}>
          Ajustes
        </AppText>
        <AppText variant="display" accessibilityRole="header">
          Configurações
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Segurança, privacidade e gerenciamento da sua conta.
        </AppText>
      </View>
      <View style={styles.sections}>
        <ListGroup title="Segurança">
          <ListRow icon="key-outline" title="Alterar senha" onPress={() => router.push('/settings/password')} />
          <ListRow
            icon="mail-outline"
            title="Alterar e-mail"
            subtitle="Atualize o e-mail de acesso da conta"
            onPress={() => router.push('/settings/personal')}
          />
          <ListRow
            icon="phone-portrait-outline"
            title="Sair de todos os aparelhos"
            subtitle="Útil se você perdeu um celular ou usou outro aparelho"
            onPress={signOutEverywhere}
          />
        </ListGroup>

        <ListGroup title="Privacidade">
          <ListRow icon="shield-checkmark-outline" title="Política de Privacidade" onPress={() => router.push('/legal/privacy')} />
          <ListRow icon="document-text-outline" title="Termos de Uso" onPress={() => router.push('/legal/terms')} />
          <ListRow
            icon="chatbubble-ellipses-outline"
            title="Falar com a privacidade (LGPD)"
            subtitle={LEGAL_ENTITY.privacyEmail}
            onPress={() => Linking.openURL(`mailto:${LEGAL_ENTITY.privacyEmail}?subject=Privacidade%20-%20${encodeURIComponent(APP_NAME)}`)}
          />
        </ListGroup>

        <Card style={styles.dataCard}>
          <AppText variant="subtitle">Seus dados no {APP_NAME}</AppText>
          <AppText variant="small" color={colors.textSecondary}>
            Guardamos apenas o necessário: nome e e-mail da conta (privados) e as informações que você escolhe publicar no
            perfil empresarial. Sua senha é protegida pelo serviço de autenticação e nunca fica visível para ninguém. Você
            pode editar, retirar do Mural ou excluir seus dados a qualquer momento.
          </AppText>
        </Card>

        <ListGroup title="Gerenciar conta">
          {profile ? (
            <ListRow
              icon="storefront-outline"
              title="Excluir perfil empresarial"
              subtitle="Mantém sua conta, apaga o perfil e as imagens"
              destructive
              onPress={() => void remove(profile)}
            />
          ) : null}
          <ListRow
            icon="trash-outline"
            title="Excluir minha conta"
            subtitle="Exclui definitivamente a conta e os dados associados"
            destructive
            onPress={() => router.push('/settings/delete-account')}
          />
        </ListGroup>

        <View style={styles.about}>
          <AppText variant="caption" color={colors.textMuted} align="center">
            {APP_NAME} · versão {APP_VERSION}
          </AppText>
          <AppText variant="caption" color={colors.textMuted} align="center">
            Suporte: {LEGAL_ENTITY.supportEmail}
          </AppText>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  sections: {
    gap: spacing.xl,
    marginTop: spacing.xl,
  },
  dataCard: {
    gap: spacing.xs,
  },
  about: {
    gap: 4,
  },
});
