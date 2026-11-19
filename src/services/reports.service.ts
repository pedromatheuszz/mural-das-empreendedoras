import { db } from '@/lib/data-api';
import type { ReportReason } from '@/types/models';
import { AppError } from '@/utils/errors';
import { nullIfEmpty, sanitizeMultiline } from '@/utils/sanitize';

export async function reportProfile(params: {
  profileId: string;
  reporterId: string;
  reason: ReportReason;
  details: string;
}): Promise<void> {
  const { error } = await db.from('profile_reports').insert({
    profile_id: params.profileId,
    reporter_id: params.reporterId,
    reason: params.reason,
    details: nullIfEmpty(sanitizeMultiline(params.details)),
  });
  if (error) {
    if (error.code === '23505') {
      throw new AppError('Você já denunciou este perfil. Nossa equipe vai analisar.', 'duplicate_report');
    }
    throw error;
  }
}
