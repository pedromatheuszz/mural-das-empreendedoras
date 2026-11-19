import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';

import { AppText } from '../ui/app-text';

export function PreviewBanner({ message }: { message: string }) {
  return (
    <View style={styles.banner} accessibilityRole="text">
      <Ionicons name="eye-outline" size={18} color={colors.primary} />
      <View style={styles.flex}>
        <AppText variant="smallStrong" color={colors.primary}>
          Prévia do seu perfil
        </AppText>
        <AppText variant="small" color={colors.primary}>
          {message}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
});
