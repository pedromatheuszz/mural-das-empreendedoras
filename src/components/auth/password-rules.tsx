import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';
import { PASSWORD_RULES } from '@/schemas/auth.schema';

import { AppText } from '../ui/app-text';

/** Requisitos da senha atualizados enquanto a usuária digita. */
export function PasswordRules({ value }: { value: string }) {
  return (
    <View style={styles.row} accessibilityLabel="Requisitos da senha">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value);
        return (
          <View key={rule.label} style={styles.rule} accessible accessibilityLabel={`${rule.label}: ${ok ? 'ok' : 'pendente'}`}>
            <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={15} color={ok ? colors.success : colors.textMuted} />
            <AppText variant="caption" color={ok ? colors.success : colors.textSecondary}>
              {rule.label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: -spacing.xs,
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
