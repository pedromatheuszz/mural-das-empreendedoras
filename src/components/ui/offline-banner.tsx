import Ionicons from '@expo/vector-icons/Ionicons';
import { useNetInfo } from '@react-native-community/netinfo';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { colors, palette, spacing } from '@/constants/theme';

import { AppText } from './app-text';

/** Aviso discreto quando o aparelho está sem internet. */
export function OfflineBanner() {
  const { isConnected } = useNetInfo();
  if (isConnected !== false) return null;
  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} accessibilityLiveRegion="polite" accessibilityRole="alert">
      <View style={styles.banner}>
        <Ionicons name="cloud-offline-outline" size={16} color={palette.white} />
        <AppText variant="caption" color={palette.white} style={styles.text}>
          Você está sem internet. Mostrando as informações salvas.
        </AppText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.text,
  },
  text: {
    flex: 1,
  },
});
