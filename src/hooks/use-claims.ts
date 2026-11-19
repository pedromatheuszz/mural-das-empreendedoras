import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/providers/auth-provider';
import {
  cancelProfileClaim,
  getMyProfileClaim,
  linkProfileToAccount,
  listPendingClaims,
  requestProfileClaim,
  reviewProfileClaim,
} from '@/services/claims.service';

import { adminKeys } from './use-admin';
import { profileKeys } from './use-profiles';

export const claimKeys = {
  mine: (userId: string | undefined) => ['claims', 'mine', userId ?? 'anonymous'] as const,
  pending: () => ['admin', 'claims', 'pending'] as const,
};

/** Último pedido de vínculo da conta logada. */
export function useMyProfileClaim() {
  const { user } = useAuth();
  return useQuery({
    queryKey: claimKeys.mine(user?.id),
    queryFn: getMyProfileClaim,
    enabled: Boolean(user?.id),
    staleTime: 30_000,
  });
}

/** Depois de pedir, cancelar ou analisar: pedidos, perfil próprio e listas mudam. */
function useRefreshClaims() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['claims'] });
    void queryClient.invalidateQueries({ queryKey: profileKeys.all });
    void queryClient.invalidateQueries({ queryKey: adminKeys.all });
  };
}

export function useRequestProfileClaim() {
  const refresh = useRefreshClaims();
  return useMutation({
    mutationFn: (params: { profileId: string; note?: string }) => requestProfileClaim(params.profileId, params.note),
    onSuccess: refresh,
  });
}

export function useCancelProfileClaim() {
  const refresh = useRefreshClaims();
  return useMutation({ mutationFn: cancelProfileClaim, onSuccess: refresh });
}

export function usePendingClaims(enabled = true) {
  return useQuery({ queryKey: claimKeys.pending(), queryFn: listPendingClaims, enabled });
}

export function useReviewProfileClaim() {
  const refresh = useRefreshClaims();
  return useMutation({ mutationFn: reviewProfileClaim, onSuccess: refresh });
}

export function useLinkProfileToAccount() {
  const refresh = useRefreshClaims();
  return useMutation({
    mutationFn: (params: { profileId: string; email: string }) => linkProfileToAccount(params.profileId, params.email),
    onSuccess: refresh,
  });
}
