import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTabBarSpace } from '@/components/navigation/tab-bar';
import { CategoryFilter, CategoryGrid } from '@/components/profiles/category-filter';
import { ProfileCard, ProfileCardSkeleton } from '@/components/profiles/profile-card';
import { AppText } from '@/components/ui/app-text';
import { OfflineBanner } from '@/components/ui/offline-banner';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { LIMITS } from '@/constants/app';
import { getCategory } from '@/constants/categories';
import { colors, fonts, MAX_CONTENT_WIDTH, radius, shadows, spacing } from '@/constants/theme';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useSearchProfiles } from '@/hooks/use-profiles';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const debounced = useDebouncedValue(query.trim(), 350);
  const search = useSearchProfiles(debounced, category);

  useEffect(() => {
    if (focus) inputRef.current?.focus();
  }, [focus]);

  const active = debounced.length >= LIMITS.searchQuery.min || category !== null;
  const items = search.data?.pages.flatMap((page) => page.items) ?? [];
  const categoryInfo = getCategory(category);
  const typing = query.trim() !== debounced;

  const clear = () => {
    setQuery('');
    setCategory(null);
    inputRef.current?.focus();
  };

  let body = null;
  if (!active) {
    body = (
      <ScrollView
        contentContainerStyle={[styles.explore, { paddingBottom: tabBarSpace }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {query.trim().length === 1 ? (
          <AppText variant="small" color={colors.textSecondary}>
            Digite pelo menos 2 letras para buscar.
          </AppText>
        ) : null}
        <AppText variant="eyebrow" color={colors.accentText}>
          Explore por categoria
        </AppText>
        <CategoryGrid onSelect={setCategory} />
      </ScrollView>
    );
  } else if (search.isPending) {
    body = (
      <View style={styles.list}>
        <ProfileCardSkeleton />
        <ProfileCardSkeleton />
      </View>
    );
  } else if (search.isError) {
    body = <ErrorState error={search.error} onRetry={() => search.refetch()} />;
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <OfflineBanner />
      <View style={styles.top}>
        <View style={styles.titleRow}>
          <AppText variant="display" accessibilityRole="header">
            Buscar
          </AppText>
          {search.isFetching && !search.isPending ? <ActivityIndicator color={colors.primary} /> : null}
        </View>
        <AppText variant="body" color={colors.textSecondary}>
          Encontre marcas, profissionais e serviços.
        </AppText>
        <View style={styles.inputWrap}>
          <Ionicons name="search" size={20} color={colors.primary} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Marca, nome ou serviço"
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            maxLength={LIMITS.searchQuery.max}
            accessibilityLabel="Buscar por marca, nome da empreendedora ou serviço"
            selectionColor={colors.accent}
            cursorColor={colors.primary}
            style={[styles.input, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null]}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Limpar texto">
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>
      <View style={styles.filters}>
        <CategoryFilter selected={category} onSelect={setCategory} />
      </View>

      {body ?? (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.list, { paddingBottom: tabBarSpace }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            items.length > 0 ? (
              <AppText variant="smallStrong" color={colors.textSecondary} accessibilityLiveRegion="polite">
                {debounced ? `Resultados para “${debounced}”` : 'Resultados'}
                {categoryInfo ? ` em ${categoryInfo.label}` : ''}
              </AppText>
            ) : undefined
          }
          renderItem={({ item, index }) => (
            <ProfileCard
              profile={item}
              index={index}
              onPress={() => router.push({ pathname: '/entrepreneur/[id]', params: { id: item.id } })}
            />
          )}
          ListEmptyComponent={
            typing ? undefined : (
              <EmptyState
                icon="search-outline"
                title="Nenhuma empreendedora encontrada"
                message={`Não encontramos resultados${debounced ? ` para “${debounced}”` : ''}${
                  categoryInfo ? ` em ${categoryInfo.label}` : ''
                }. Tente outras palavras, como “bolo”, “design” ou “consultoria”.`}
                actionLabel="Limpar busca"
                onAction={clear}
              />
            )
          }
          ListFooterComponent={
            search.isFetchingNextPage ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : undefined
          }
          onEndReached={() => {
            if (search.hasNextPage && !search.isFetchingNextPage) void search.fetchNextPage();
          }}
          onEndReachedThreshold={0.6}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  top: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    ...shadows.card,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
    height: '100%',
  },
  filters: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingVertical: spacing.md,
  },
  explore: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  list: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  loader: {
    marginVertical: spacing.lg,
  },
});
