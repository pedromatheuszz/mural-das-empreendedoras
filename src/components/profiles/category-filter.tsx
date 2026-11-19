import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, View } from 'react-native';

import { CATEGORIES } from '@/constants/categories';
import { colors, radius, spacing } from '@/constants/theme';

import { AppText } from '../ui/app-text';
import { Chip } from '../ui/chip';
import { PRESS_SCALE } from '@/constants/motion';
import { PressableScale } from '../ui/pressable-scale';

type CategoryFilterProps = {
  selected: string | null;
  onSelect: (slug: string | null) => void;
};

/** Filtro horizontal de categorias ("Todas" + categorias). */
export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityLabel="Filtrar por categoria"
    >
      <Chip label="Todas" icon="apps-outline" selected={selected === null} onPress={() => onSelect(null)} />
      {CATEGORIES.map((category) => (
        <Chip
          key={category.slug}
          label={category.label}
          icon={category.icon}
          selected={selected === category.slug}
          onPress={() => onSelect(selected === category.slug ? null : category.slug)}
        />
      ))}
    </ScrollView>
  );
}

/** Grade de categorias para explorar (estado inicial da busca). */
export function CategoryGrid({ onSelect }: { onSelect: (slug: string) => void }) {
  return (
    <View style={styles.grid}>
      {CATEGORIES.map((category) => (
        <PressableScale
          key={category.slug}
          onPress={() => onSelect(category.slug)}
          accessibilityRole="button"
          accessibilityLabel={`Explorar ${category.label}`}
          scaleTo={PRESS_SCALE.button}
          style={styles.tile}
          pressedStyle={styles.tilePressed}
        >
          <View style={[styles.tileIcon, { backgroundColor: category.tone.background }]}>
            <Ionicons name={category.icon} size={22} color={category.tone.foreground} />
          </View>
          <AppText variant="smallStrong" numberOfLines={2} style={styles.tileLabel}>
            {category.label}
          </AppText>
        </PressableScale>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 64,
  },
  tilePressed: {
    backgroundColor: colors.accentSubtle,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    flex: 1,
  },
});
