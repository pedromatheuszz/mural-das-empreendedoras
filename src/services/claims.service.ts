import { db } from '@/lib/data-api';
import type { Database } from '@/types/database';
import { sanitizeMultiline } from '@/utils/sanitize';

/**
 * Vínculo de um perfil do grupo (cadastrado pela organização) à conta da empreendedora.
 * Todas as regras ficam no banco: só perfis sem dona, só para quem ainda não tem perfil,
 * e a confirmação é feita pela equipe do Mural (administradora ou desenvolvedor).
 */
type Functions = Database['public']['Functions'];
export type MyClaim = Functions['my_profile_claim']['Returns'][number];
export type PendingClaim = Functions['list_pending_claims']['Returns'][number];

const cleanNote = (note?: string | null) => {
  const value = sanitizeMultiline(note ?? '').slice(0, 500);
  return value.length > 0 ? value : null;
};

export async function requestProfileClaim(profileId: string, note?: string): Promise<void> {
  const { error } = await db.rpc('request_profile_claim', { target_profile_id: profileId, note: cleanNote(note) });
  if (error) throw error;
}

export async function cancelProfileClaim(claimId: string): Promise<void> {
  const { error } = await db.rpc('cancel_profile_claim', { target_claim_id: claimId });
  if (error) throw error;
}

/** Último pedido da conta logada (ou null se nunca pediu). */
export async function getMyProfileClaim(): Promise<MyClaim | null> {
  const { data, error } = await db.rpc('my_profile_claim');
  if (error) throw error;
  return data?.[0] ?? null;
}

export async function listPendingClaims(): Promise<PendingClaim[]> {
  const { data, error } = await db.rpc('list_pending_claims');
  if (error) throw error;
  return data ?? [];
}

export async function reviewProfileClaim(params: { claimId: string; approve: boolean; note?: string }): Promise<void> {
  const { error } = await db.rpc('review_profile_claim', {
    target_claim_id: params.claimId,
    approve: params.approve,
    note: cleanNote(params.note),
  });
  if (error) throw error;
}

export async function linkProfileToAccount(profileId: string, email: string): Promise<void> {
  const { error } = await db.rpc('link_profile_to_account', {
    target_profile_id: profileId,
    target_email: email.trim().toLowerCase(),
  });
  if (error) throw error;
}
