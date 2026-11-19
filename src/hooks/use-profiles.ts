import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { LIMITS } from '@/constants/app';
import { useAuth } from '@/providers/auth-provider';
import type { ProfileFormValues } from '@/schemas/profile.schema';
import {
  createProfile,
  deleteProfile,
  getMyProfile,
  getPublicProfile,
  listHubProfiles,
  listRecentProfiles,
  searchProfiles,
  setPublicationStatus,
  updateProfile,
} from '@/services/profiles.service';
import { reportProfile } from '@/services/reports.service';
import type { EntrepreneurProfile, PublicationStatus, ReportReason } from '@/types/models';

export const profileKeys = {
  all: ['profiles'] as const,
  hub: (category: string | null) => ['profiles', 'hub', category ?? 'all'] as const,
  recent: () => ['profiles', 'recent'] as const,
  search: (query: string, category: string | null) => ['profiles', 'search', query, category ?? 'all'] as const,
  detail: (id: string) => ['profiles', 'detail', id] as const,
  mine: (userId: string | undefined) => ['profiles', 'mine', userId ?? 'anonymous'] as const,
};

/** Lista paginada do Mural (somente perfis publicados). */
export function useHubProfiles(category: string | null) {
  return useInfiniteQuery({
    queryKey: profileKeys.hub(category),
    queryFn: ({ pageParam }) => listHubProfiles({ page: pageParam, category }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
}

export function useRecentProfiles(enabled = true) {
  return useQuery({
    queryKey: profileKeys.recent(),
    queryFn: () => listRecentProfiles(),
    enabled,
  });
}

export function useSearchProfiles(query: string, category: string | null) {
  const term = query.trim();
  const enabled = term.length >= LIMITS.searchQuery.min || category !== null;
  return useInfiniteQuery({
    queryKey: profileKeys.search(term.toLocaleLowerCase('pt-BR'), category),
    queryFn: ({ pageParam }) => searchProfiles({ query: term, category, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled,
    staleTime: 30_000,
  });
}

export function usePublicProfile(id: string | undefined) {
  return useQuery({
    queryKey: profileKeys.detail(id ?? ''),
    queryFn: () => getPublicProfile(id ?? ''),
    enabled: Boolean(id),
  });
}

/** Perfil empresarial da usuária logada (null se ainda não criou). */
export function useMyProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: profileKeys.mine(user?.id),
    queryFn: () => getMyProfile(user?.id ?? ''),
    enabled: Boolean(user?.id),
  });
}

function useProfileCacheSync() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return (profile: EntrepreneurProfile | null) => {
    queryClient.setQueryData(profileKeys.mine(user?.id), profile);
    // Listas, busca e detalhes podem ter mudado.
    void queryClient.invalidateQueries({
      queryKey: profileKeys.all,
      predicate: (query) => query.queryKey[1] !== 'mine',
    });
  };
}

export function useCreateProfile() {
  const { user } = useAuth();
  const sync = useProfileCacheSync();
  return useMutation({
    mutationFn: (params: { values: ProfileFormValues; publish: boolean }) =>
      createProfile({ userId: user?.id ?? '', ...params }),
    onSuccess: (profile) => sync(profile),
  });
}

export function useUpdateProfile() {
  const sync = useProfileCacheSync();
  return useMutation({
    mutationFn: (params: { profile: EntrepreneurProfile; values: ProfileFormValues }) => updateProfile(params),
    onSuccess: (profile) => sync(profile),
  });
}

export function useSetPublicationStatus() {
  const sync = useProfileCacheSync();
  return useMutation({
    mutationFn: (params: { profileId: string; status: Exclude<PublicationStatus, 'suspended'>; consent?: boolean }) =>
      setPublicationStatus(params),
    onSuccess: (profile) => sync(profile),
  });
}

export function useDeleteProfile() {
  const sync = useProfileCacheSync();
  return useMutation({
    mutationFn: (profile: EntrepreneurProfile) => deleteProfile(profile),
    onSuccess: () => sync(null),
  });
}

export function useReportProfile() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: (params: { profileId: string; reason: ReportReason; details: string }) =>
      reportProfile({ ...params, reporterId: user?.id ?? '' }),
  });
}
