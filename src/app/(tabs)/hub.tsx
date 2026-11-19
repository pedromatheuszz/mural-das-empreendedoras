import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState, type ReactElement } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HubHeader, PublishCta, RecentCarousel, SearchPill } from '@/components/hub/hub-sections';
import { useTabBarSpace } from '@/components/navigation/tab-bar';
import { CategoryFilter } from '@/components/profiles/category-filter';
import { useOpenLink } from '@/components/profiles/contact-actions';
import { ProfileCard, ProfileCardSkeleton } from '@/components/profiles/profile-card';
import { AppText } from '@/components/ui/app-text';
import { SectionHeader } from '@/components/ui/layout';
import { OfflineBanner } from '@/components/ui/offline-banner';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { TextLink } from '@/components/ui/text-link';
import { COMMUNITY } from '@/constants/app';
import { getCategory } from '@/constants/categories';
import { colors, MAX_CONTENT_WIDTH, spacing } from '@/constants/theme';
import { useAccount } from '@/hooks/use-account';
import { useHubProfiles, useMyProfile, useRecentProfiles } from '@/hooks/use-profiles';

export default function HubScreen() {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const hub = useHubProfiles(category);
  const recent = useRecentProfiles(category === null);
  const account = useAccount();
  const myProfile = useMyProfile();
  const openLink = useOpenLink();
  const tabBarSpace = useTabBarSpace();

  const items = hub.data?.pages.flatMap((page) => page.items) ?? [];
  const categoryInfo = getCategory(category);
  const openProfile = (id: string) => router.push({ pathname: '/entrepreneur/[id]', params: { id } });

  const refresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([hub.refetch(), category === null ? recent.refetch() : null, myProfile.refetch()]);
    setRefreshing(false);
  };

  const header = (
    <View style={styles.headerStack}>
      <HubHeader fullName={account.data?.full_name} photoUri={myProfile.data?.profile_image_url} />
      <SearchPill />
      <CategoryFilter selected={category} onSelect={setCategory} />
      {category === null ? (
        <RecentCarousel profiles={recent.data} isPending={recent.isPending} onOpen={openProfile} />
      ) : null}
      {myProfile.isSuccess ? <PublishCta status={myProfile.data?.publication_status ?? null} /> : null}
      <View style={styles.padded}>
        <SectionHeader
          eyebrow={categoryInfo ? 'Categoria' : 'Explore'}
          title={categoryInfo ? categoryInfo.label : 'Todas as empreendedoras'}
        />
      </View>
    </View>
  );

  let empty: ReactElement;
  if (hub.isPending) {
    empty = (
      <View style={styles.skeletons}>
        <ProfileCardSkeleton />
        <ProfileCardSkeleton />
      </View>
    );
  } else if (hub.isError) {
    empty = <ErrorState error={hub.error} onRetry={() => hub.refetch()} />;
  } else if (categoryInfo) {
    empty = (
      <EmptyState
        icon={categoryInfo.icon}
        title="Ninguém por aqui ainda"
        message={`Ainda não há perfis publicados em ${categoryInfo.label}. Explore outras categorias ou divulgue o seu negócio.`}
        actionLabel="Ver todas as categorias"
        onAction={() => setCategory(null)}
      />
    );
  } else {
    empty = (
      <EmptyState
        icon="flower-outline"
        title="O Mural está começando!"
        message="Ainda não há perfis publicados. Que tal ser a primeira a divulgar a sua marca?"
        actionLabel="Divulgar minha marca"
        onAction={() => router.navigate('/publish')}
      />
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <OfflineBanner />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.padded}>
            <ProfileCard profile={item} index={index} onPress={() => openProfile(item.id)} />
          </View>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={
          hub.isFetchingNextPage ? (
            <ActivityIndicator color={colors.primary} style={styles.footerLoader} />
          ) : !hub.hasNextPage && items.length > 0 ? (
            <View style={styles.endBlock}>
              <View style={styles.end}>
                <Ionicons name="flower-outline" size={18} color={colors.accent} />
                <AppText variant="caption" color={colors.textMuted}>
                  Você chegou ao fim da lista
                </AppText>
              </View>
              <TextLink
                label={`Siga o grupo ${COMMUNITY.name} no Instagram`}
                onPress={() => void openLink(COMMUNITY.instagramUrl)}
              />
            </View>
          ) : undefined
        }
        onEndReached={() => {
          if (hub.hasNextPage && !hub.isFetchingNextPage) void hub.fetchNextPage();
        }}
        onEndReachedThreshold={0.6}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace }]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={6}
        windowSize={9}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  headerStack: {
    gap: spacing.lg,
    marginBottom: spacing.xxs,
  },
  padded: {
    paddingHorizontal: spacing.lg,
  },
  skeletons: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  footerLoader: {
    marginVertical: spacing.lg,
  },
  endBlock: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xxs,
  },
  end: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
