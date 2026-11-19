import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { RoleName } from '@/constants/roles';
import { useAuth } from '@/providers/auth-provider';
import type { ProfileFormValues } from '@/schemas/profile.schema';
import {
  deleteProfileAsStaff,
  getProfileById,
  listMembers,
  listOpenReports,
  moderateProfile,
  resolveReport,
  setMemberRole,
} from '@/services/admin.service';
import { updateProfile } from '@/services/profiles.service';
import type { EntrepreneurProfile } from '@/types/models';

import { profileKeys } from './use-profiles';

export const adminKeys = {
  all: ['admin'] as const,
  reports: () => ['admin', 'reports'] as const,
  members: (search: string) => ['admin', 'members', search] as const,
  profile: (id: string) => ['admin', 'profile', id] as const,
};

/** Depois de qualquer ação da equipe, listas, buscas e detalhes precisam ser recarregados. */
function useRefreshAfterStaffAction() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: profileKeys.all });
    void queryClient.invalidateQueries({ queryKey: adminKeys.all });
  };
}

export function useStaffProfile(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.profile(id ?? ''),
    queryFn: () => getProfileById(id ?? ''),
    enabled: Boolean(id),
  });
}

export function useModerateProfile() {
  const refresh = useRefreshAfterStaffAction();
  return useMutation({ mutationFn: moderateProfile, onSuccess: refresh });
}

export function useStaffDeleteProfile() {
  const refresh = useRefreshAfterStaffAction();
  return useMutation({ mutationFn: deleteProfileAsStaff, onSuccess: refresh });
}

export function useStaffUpdateProfile() {
  const { user } = useAuth();
  const refresh = useRefreshAfterStaffAction();
  return useMutation({
    mutationFn: (params: { profile: EntrepreneurProfile; values: ProfileFormValues }) =>
      updateProfile({ ...params, editorId: user?.id }),
    onSuccess: refresh,
  });
}

export function useOpenReports(enabled = true) {
  return useQuery({ queryKey: adminKeys.reports(), queryFn: listOpenReports, enabled });
}

export function useResolveReport() {
  const refresh = useRefreshAfterStaffAction();
  return useMutation({ mutationFn: resolveReport, onSuccess: refresh });
}

export function useMembers(search: string, enabled = true) {
  return useQuery({
    queryKey: adminKeys.members(search.trim().toLocaleLowerCase('pt-BR')),
    queryFn: () => listMembers(search),
    enabled,
    staleTime: 30_000,
  });
}

export function useSetMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { userId: string; role: RoleName }) => setMemberRole(params.userId, params.role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'members'] }),
  });
}
