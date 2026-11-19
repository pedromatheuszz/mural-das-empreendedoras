import type { RoleName } from '@/constants/roles';
import { db } from '@/lib/data-api';
import type { Database } from '@/types/database';
import type { EntrepreneurProfile, PublicationStatus } from '@/types/models';
import { AppError } from '@/utils/errors';
import { sanitizeLine } from '@/utils/sanitize';

/**
 * Ações da equipe do Mural (desenvolvedor e administradoras). Cada ação é validada
 * novamente no banco: sem o cargo certo, o Neon recusa a operação.
 */

type Functions = Database['public']['Functions'];
export type OpenReport = Functions['list_open_reports']['Returns'][number];
export type Member = Functions['list_members']['Returns'][number];

export async function getMyRole(): Promise<RoleName> {
  const { data, error } = await db.rpc('my_role');
  if (error) throw error;
  return data ?? 'entrepreneur';
}

/** Perfil completo por id (a equipe também enxerga perfis fora do Mural). */
export async function getProfileById(id: string): Promise<EntrepreneurProfile | null> {
  const { data, error } = await db.from('entrepreneur_profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function moderateProfile(params: {
  profileId: string;
  status: Extract<PublicationStatus, 'suspended' | 'published' | 'unpublished'>;
  reason?: string;
}): Promise<void> {
  const reason = params.reason ? sanitizeLine(params.reason) : null;
  if (params.status === 'suspended' && !reason) {
    throw new AppError('Informe o motivo da suspensão. Ele aparece para a empreendedora.');
  }
  const { error } = await db.rpc('moderate_profile', {
    target_profile_id: params.profileId,
    new_status: params.status,
    reason,
  });
  if (error) throw error;
}

export async function deleteProfileAsStaff(profileId: string): Promise<void> {
  const { data, error } = await db.from('entrepreneur_profiles').delete().eq('id', profileId).select('id');
  if (error) throw error;
  // Sem permissão, a RLS não apaga nada (e não devolve erro).
  if (!data?.length) throw new AppError('Você não tem permissão para excluir este perfil.', 'forbidden');
}

export async function listOpenReports(): Promise<OpenReport[]> {
  const { data, error } = await db.rpc('list_open_reports', { page_size: 100 });
  if (error) throw error;
  return data ?? [];
}

export async function resolveReport(params: {
  reportId: string;
  status: 'resolved' | 'dismissed';
  note?: string;
}): Promise<void> {
  const { error } = await db
    .from('profile_reports')
    .update({
      status: params.status,
      resolution_note: params.note ? sanitizeLine(params.note) : null,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', params.reportId);
  if (error) throw error;
}

export async function listMembers(search: string): Promise<Member[]> {
  const { data, error } = await db.rpc('list_members', { search: search.trim().slice(0, 100), page_size: 50 });
  if (error) throw error;
  return data ?? [];
}

export async function setMemberRole(userId: string, role: RoleName): Promise<void> {
  const { error } = await db.rpc('set_member_role', { target_user_id: userId, new_role: role });
  if (error) throw error;
}
