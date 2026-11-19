import type Ionicons from '@expo/vector-icons/Ionicons';

import { getCategory } from '@/constants/categories';
import { colors, palette } from '@/constants/theme';
import type { PublicationStatus } from '@/types/models';

import { Pill } from '../ui/chip';

export function CategoryPill({ slug, size = 'sm' }: { slug: string | null | undefined; size?: 'sm' | 'md' }) {
  const category = getCategory(slug);
  if (!category) return null;
  return (
    <Pill
      label={category.label}
      icon={category.icon}
      background={category.tone.background}
      foreground={category.tone.foreground}
      size={size}
    />
  );
}

export const STATUS_INFO: Record<
  PublicationStatus,
  { label: string; description: string; icon: keyof typeof Ionicons.glyphMap; background: string; foreground: string }
> = {
  draft: {
    label: 'Rascunho',
    description: 'Seu perfil ainda não aparece no Mural. Publique quando estiver pronta.',
    icon: 'create-outline',
    background: colors.surfaceMuted,
    foreground: palette.graphite700,
  },
  published: {
    label: 'Publicado',
    description: 'Seu perfil está visível no Mural para todas as usuárias.',
    icon: 'checkmark-circle',
    background: colors.successSoft,
    foreground: colors.success,
  },
  unpublished: {
    label: 'Fora do Mural',
    description: 'Você retirou seu perfil temporariamente. Ele volta a aparecer quando publicar de novo.',
    icon: 'eye-off-outline',
    background: colors.warningSoft,
    foreground: colors.warning,
  },
  suspended: {
    label: 'Suspenso',
    description: 'A moderação do Mural suspendeu este perfil. Fale com o suporte para entender o motivo.',
    icon: 'ban-outline',
    background: colors.dangerSoft,
    foreground: colors.danger,
  },
};

export function StatusBadge({ status, size = 'sm' }: { status: PublicationStatus; size?: 'sm' | 'md' }) {
  const info = STATUS_INFO[status];
  return (
    <Pill label={info.label} icon={info.icon} background={info.background} foreground={info.foreground} size={size} />
  );
}
