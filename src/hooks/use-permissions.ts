import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { can, isStaff, profileAbilities, type Permission, type RoleName } from '@/constants/roles';
import { useAuth } from '@/providers/auth-provider';
import { getMyRole } from '@/services/admin.service';

export const roleKeys = {
  mine: (userId: string | undefined) => ['account', userId ?? 'anonymous', 'role'] as const,
};

/** Cargo da conta logada (desenvolvedor, administradora ou empreendedora). */
export function useMyRole() {
  const { user } = useAuth();
  return useQuery({
    queryKey: roleKeys.mine(user?.id),
    queryFn: getMyRole,
    enabled: Boolean(user?.id),
    // O cargo decide o que aparece na tela: em caso de falha, tenta de novo algumas vezes
    // (o Neon pode, raramente, não identificar a sessão numa requisição isolada).
    retry: 4,
    retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 4000),
    staleTime: 60_000,
  });
}

/** Permissões da conta logada. Enquanto o cargo carrega, nada extra é liberado. */
export function usePermissions() {
  const { user } = useAuth();
  const { data: role } = useMyRole();
  return {
    role: role as RoleName | undefined,
    isStaff: isStaff(role),
    can: (permission: Permission) => can(role, permission),
    forProfile: (profile: { user_id: string | null }) => profileAbilities(role, profile, user?.id),
  };
}

/** Recarrega o cargo sempre que a tela ganha foco (ex.: depois de uma promoção). */
export function useRefreshRoleOnFocus() {
  const { refetch } = useMyRole();
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );
}
