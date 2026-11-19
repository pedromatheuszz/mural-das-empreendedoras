import type Ionicons from '@expo/vector-icons/Ionicons';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, View } from 'react-native';

import { useToast } from '@/components/feedback/toast-provider';
import { APP_NAME } from '@/constants/app';
import { colors, spacing } from '@/constants/theme';
import { describeLink, type LinkInfo } from '@/utils/url';

import { Button } from '../ui/button';

const ICONS: Record<LinkInfo['kind'], keyof typeof Ionicons.glyphMap> = {
  whatsapp: 'logo-whatsapp',
  instagram: 'logo-instagram',
  tiktok: 'logo-tiktok',
  facebook: 'logo-facebook',
  linkedin: 'logo-linkedin',
  youtube: 'logo-youtube',
  x: 'logo-twitter',
  pinterest: 'logo-pinterest',
  website: 'globe-outline',
};

export function linkIcon(kind: LinkInfo['kind']) {
  return ICONS[kind];
}

/** Adiciona uma mensagem inicial ao WhatsApp para a empreendedora saber de onde veio o contato. */
export function withWhatsAppGreeting(url: string): string {
  if (describeLink(url).kind !== 'whatsapp' || url.includes('text=')) return url;
  const text = encodeURIComponent(`Olá! Encontrei seu perfil no ${APP_NAME} e gostaria de saber mais.`);
  return `${url}${url.includes('?') ? '&' : '?'}text=${text}`;
}

export function useOpenLink() {
  const toast = useToast();
  return async (url: string) => {
    try {
      const info = describeLink(url);
      if (info.kind === 'website') {
        await WebBrowser.openBrowserAsync(url, { controlsColor: colors.primary, toolbarColor: colors.background });
      } else {
        await Linking.openURL(info.kind === 'whatsapp' ? withWhatsAppGreeting(url) : url);
      }
    } catch {
      toast.error('Não foi possível abrir este link no seu aparelho.');
    }
  };
}

type ContactActionsProps = {
  contactUrl: string | null;
  socialUrl: string | null;
  websiteUrl: string | null;
};

/** Botões de contato publicados pela empreendedora. */
export function ContactActions({ contactUrl, socialUrl, websiteUrl }: ContactActionsProps) {
  const open = useOpenLink();
  const contact = contactUrl ? describeLink(contactUrl) : null;
  const social = socialUrl ? describeLink(socialUrl) : null;
  const website = websiteUrl ? describeLink(websiteUrl) : null;

  if (!contact && !social && !website) return null;

  // Sem WhatsApp/contato, a rede social vira o botão principal (caso comum no Instagram).
  const socialIsPrimary = !contact && Boolean(social);

  return (
    <View style={styles.container}>
      {contact && contactUrl ? (
        <Button
          title={contact.kind === 'whatsapp' ? 'Chamar no WhatsApp' : 'Entrar em contato'}
          icon={contact.kind === 'whatsapp' ? 'logo-whatsapp' : 'chatbubble-ellipses-outline'}
          onPress={() => open(contactUrl)}
          accessibilityHint={`Abre ${contact.label}: ${contact.display}`}
          fullWidth
        />
      ) : null}
      {socialIsPrimary && social && socialUrl ? (
        <Button
          title={social.kind === 'website' ? 'Ver rede social' : `Ver no ${social.label}`}
          icon={ICONS[social.kind]}
          onPress={() => open(socialUrl)}
          accessibilityHint={`Abre ${social.display}`}
          fullWidth
        />
      ) : null}
      {(social && !socialIsPrimary) || website ? (
        <View style={styles.row}>
          {social && socialUrl && !socialIsPrimary ? (
            <Button
              title={social.kind === 'website' ? 'Rede social' : social.label}
              icon={ICONS[social.kind]}
              variant="secondary"
              size="md"
              onPress={() => open(socialUrl)}
              accessibilityHint={`Abre ${social.display}`}
              style={styles.flex}
              fullWidth
            />
          ) : null}
          {website && websiteUrl ? (
            <Button
              title="Site"
              icon="globe-outline"
              variant="secondary"
              size="md"
              onPress={() => open(websiteUrl)}
              accessibilityHint={`Abre ${website.display}`}
              style={styles.flex}
              fullWidth
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  flex: {
    flex: 1,
  },
});
