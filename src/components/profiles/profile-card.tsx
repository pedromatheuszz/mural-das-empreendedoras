import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { getCategory } from '@/constants/categories';
import { colors, radius, shadows, spacing } from '@/constants/theme';
import type { ProfileSummary } from '@/types/models';
import { formatLocation } from '@/utils/format';
import { describeLink } from '@/utils/url';

import { AppText } from '../ui/app-text';
import { Button } from '../ui/button';
import { Pill } from '../ui/chip';
import { IconButton } from '../ui/icon-button';
import { Skeleton } from '../ui/states';
import { CategoryPill } from './badges';
import { useOpenLink } from './contact-actions';
import { ProfileImage } from './profile-image';

type ProfileCardProps = {
  profile: ProfileSummary;
  onPress: () => void;
  index?: number;
};

/** Card de empreendedora usado no Mural e na busca. */
export function ProfileCard({ profile, onPress, index = 0 }: ProfileCardProps) {
  const open = useOpenLink();
  const location = formatLocation(profile.city, profile.state);
  const category = getCategory(profile.category);
  const whatsapp = profile.contact_url && describeLink(profile.contact_url).kind === 'whatsapp' ? profile.contact_url : null;

  const summary = [
    profile.business_name,
    `por ${profile.entrepreneur_name}`,
    category?.label,
    location,
    profile.serves_nationwide ? 'Atende todo o Brasil' : null,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 45).duration(320)} style={styles.card}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={summary}
        accessibilityHint="Abre o perfil completo"
        style={({ pressed }) => [styles.body, pressed ? styles.pressed : null]}
      >
        <View style={styles.header}>
          <ProfileImage uri={profile.logo_url ?? profile.profile_image_url} name={profile.business_name} size={64} />
          <View style={styles.titles}>
            <AppText variant="heading" numberOfLines={2}>
              {profile.business_name}
            </AppText>
            <AppText variant="small" color={colors.textSecondary} numberOfLines={1}>
              por {profile.entrepreneur_name}
            </AppText>
          </View>
        </View>
        <AppText variant="body" color={colors.textSecondary} numberOfLines={2}>
          {profile.service_description}
        </AppText>
        <View style={styles.tags}>
          <CategoryPill slug={profile.category} />
          {location ? <Pill icon="location-outline" label={location} /> : null}
          {profile.serves_nationwide ? <Pill icon="globe-outline" label="Todo o Brasil" /> : null}
        </View>
      </Pressable>
      <View style={styles.footer}>
        <Button
          title="Ver perfil"
          size="sm"
          variant="soft"
          icon="arrow-forward"
          iconPosition="right"
          onPress={onPress}
          accessibilityLabel={`Ver perfil de ${profile.business_name}`}
        />
        {whatsapp ? (
          <IconButton
            icon="logo-whatsapp"
            variant="surface"
            size={38}
            iconSize={19}
            accessibilityLabel={`Chamar ${profile.business_name} no WhatsApp`}
            onPress={() => open(whatsapp)}
          />
        ) : null}
      </View>
    </Animated.View>
  );
}

export function ProfileCardSkeleton() {
  return (
    <View style={[styles.card, styles.body]}>
      <View style={styles.header}>
        <Skeleton width={64} height={64} borderRadius={radius.lg} />
        <View style={[styles.titles, { gap: spacing.xs }]}>
          <Skeleton width="70%" height={18} />
          <Skeleton width="40%" height={12} />
        </View>
      </View>
      <Skeleton height={12} />
      <Skeleton width="85%" height={12} />
      <View style={styles.tags}>
        <Skeleton width={110} height={24} borderRadius={radius.pill} />
        <Skeleton width={90} height={24} borderRadius={radius.pill} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  body: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  pressed: {
    backgroundColor: colors.accentSubtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.xxs,
  },
});
