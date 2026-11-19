import { router } from 'expo-router';

import { Pill } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { EmptyState } from '@/components/ui/states';
import { ROLE_INFO, type RoleName } from '@/constants/roles';
import { colors } from '@/constants/theme';

const ROLE_ICON = {
  developer: 'code-slash',
  administrator: 'shield-checkmark',
  entrepreneur: 'storefront',
} as const;

/** Selo com o cargo da conta. */
export function RolePill({ role, size = 'sm' }: { role: RoleName; size?: 'sm' | 'md' }) {
  const staff = role !== 'entrepreneur';
  return (
    <Pill
      label={ROLE_INFO[role].label}
      icon={ROLE_ICON[role]}
      size={size}
      background={staff ? colors.primarySoft : colors.surfaceSunken}
      foreground={staff ? colors.primary : colors.textSecondary}
    />
  );
}

/** Tela exibida quando a conta não tem o cargo necessário. */
export function RestrictedScreen({ title }: { title?: string }) {
  return (
    <Screen>
      <ScreenHeader title={title} />
      <EmptyState
        icon="lock-closed-outline"
        title="Acesso restrito"
        message="Esta área é exclusiva da equipe do Mural."
        actionLabel="Voltar para o Mural"
        onAction={() => router.replace('/hub')}
      />
    </Screen>
  );
}
