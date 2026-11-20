import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { db } from '@/lib/data-api';
import type { Database } from '@/types/database';

/**
 * Atualização do app pela API: o desenvolvedor publica versões (npm run release) e o app
 * compara com a versão instalada.
 */
export type AppRelease = Database['public']['Functions']['latest_app_release']['Returns'][number];
export type UpdateStatus = 'required' | 'available' | 'current';

/** Versão instalada (a do app.json no momento do build). */
export const installedVersion = Constants.expoConfig?.version ?? '0.0.0';

/** Plataforma que recebe atualização pela API (no navegador não há instalação). */
export const updatePlatform = Platform.OS === 'android' || Platform.OS === 'ios' ? Platform.OS : null;

/** Compara versões "1.0.10" x "1.0.9" numericamente. Negativo: a < b; 0: iguais; positivo: a > b. */
export function compareVersions(a: string, b: string): number {
  const left = a.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const right = b.split('.').map((part) => Number.parseInt(part, 10) || 0);
  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    const diff = (left[index] ?? 0) - (right[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** Obrigatória se a versão instalada é menor que a mínima; disponível se é menor que a última. */
export function getUpdateStatus(installed: string, release: AppRelease | null): UpdateStatus {
  if (!release) return 'current';
  if (compareVersions(installed, release.min_supported_version) < 0) return 'required';
  if (compareVersions(installed, release.version) < 0) return 'available';
  return 'current';
}

export async function getLatestRelease(): Promise<AppRelease | null> {
  if (!updatePlatform) return null;
  const { data, error } = await db.rpc('latest_app_release', { target_platform: updatePlatform });
  if (error) throw error;
  return data?.[0] ?? null;
}
