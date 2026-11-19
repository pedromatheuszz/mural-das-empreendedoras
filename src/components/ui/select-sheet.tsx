import Ionicons from '@expo/vector-icons/Ionicons';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/constants/theme';

import { AppText } from './app-text';
import { IconButton } from './icon-button';
import { PressableScale } from './pressable-scale';

type Option<T extends string> = { value: T; label: string; description?: string };

type SelectSheetProps<T extends string> = {
  visible: boolean;
  title: string;
  options: readonly Option<T>[];
  selected: T | null;
  onSelect: (value: T | null) => void;
  onClose: () => void;
  clearLabel?: string;
};

/** Lista de opções em uma folha inferior (ex.: escolha do estado/UF). */
export function SelectSheet<T extends string>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
  clearLabel,
}: SelectSheetProps<T>) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fechar lista" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.sm }]} accessibilityViewIsModal>
          <View style={styles.handle} />
          <View style={styles.header}>
            <AppText variant="heading" accessibilityRole="header">
              {title}
            </AppText>
            <IconButton icon="close" accessibilityLabel="Fechar" onPress={onClose} size={40} iconSize={20} />
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            style={styles.list}
            ListHeaderComponent={
              clearLabel ? (
                <OptionRow
                  label={clearLabel}
                  selected={selected === null}
                  onPress={() => {
                    onSelect(null);
                    onClose();
                  }}
                />
              ) : undefined
            }
            renderItem={({ item }) => (
              <OptionRow
                label={item.label}
                description={item.description}
                selected={item.value === selected}
                onPress={() => {
                  onSelect(item.value);
                  onClose();
                }}
              />
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

function OptionRow({
  label,
  description,
  selected,
  onPress,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      scaleTo={1}
      style={styles.option}
      pressedStyle={styles.optionPressed}
    >
      <View style={styles.optionTexts}>
        <AppText variant={selected ? 'bodyStrong' : 'body'} color={selected ? colors.primary : colors.text}>
          {label}
        </AppText>
        {description ? (
          <AppText variant="small" color={colors.textSecondary}>
            {description}
          </AppText>
        ) : null}
      </View>
      {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.scrim,
  },
  sheet: {
    maxHeight: '75%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingTop: spacing.xs,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  list: {
    paddingHorizontal: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    minHeight: 52,
  },
  optionPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  optionTexts: {
    flex: 1,
    gap: 2,
  },
});
