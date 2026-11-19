import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { COMMUNITY } from '@/constants/app';
import { colors, radius, spacing } from '@/constants/theme';

import { AppText } from '../ui/app-text';
import { TextLink } from '../ui/text-link';
import { useOpenLink } from './contact-actions';

/** Aviso exibido nos perfis cadastrados pela organização do grupo. */
export function CommunityBanner() {
  const open = useOpenLink();
  return (
    <View style={styles.banner}>
      <Ionicons name="people-outline" size={18} color={colors.primary} />
      <View style={styles.texts}>
        <AppText variant="small" color={colors.primary}>
          Perfil divulgado pelo grupo {COMMUNITY.name}.
        </AppText>
        <TextLink
          label={`Conheça o grupo: ${COMMUNITY.instagramHandle}`}
          onPress={() => void open(COMMUNITY.instagramUrl)}
          accessibilityHint="Abre o Instagram do grupo"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  texts: {
    flex: 1,
  },
});
