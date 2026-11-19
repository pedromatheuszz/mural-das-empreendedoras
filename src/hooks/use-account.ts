import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/providers/auth-provider';
import { deleteAccount, getAccount, updateFullName } from '@/services/account.service';

export const accountKeys = {
  detail: (userId: string | undefined) => ['account', userId ?? 'anonymous'] as const,
};

/** Dados privados da conta (nome e e-mail). */
export function useAccount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: accountKeys.detail(user?.id),
    queryFn: getAccount,
    enabled: Boolean(user?.id),
  });
}

export function useUpdateFullName() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fullName: string) => updateFullName(user?.id ?? '', fullName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.detail(user?.id) }),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: deleteAccount,
  });
}

