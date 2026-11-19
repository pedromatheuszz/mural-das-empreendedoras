import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';
import type { LegalDocument } from '@/constants/legal';

import { AppText } from '../ui/app-text';
import { Screen } from '../ui/screen';
import { ScreenHeader } from '../ui/screen-header';

export function LegalDocumentView({ document }: { document: LegalDocument }) {
  return (
    <Screen scroll>
      <ScreenHeader title={document.title} />
      <View style={styles.header}>
        <AppText variant="display" accessibilityRole="header">
          {document.title}
        </AppText>
        <AppText variant="caption" color={colors.textMuted}>
          Versão {document.updatedAt}
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          {document.intro}
        </AppText>
      </View>
      <View style={styles.sections}>
        {document.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <AppText variant="subtitle" accessibilityRole="header">
              {section.title}
            </AppText>
            {section.paragraphs.map((paragraph) => (
              <AppText key={paragraph} variant="body" color={colors.textSecondary} selectable>
                {paragraph}
              </AppText>
            ))}
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  sections: {
    gap: spacing.md,
  },
  section: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
