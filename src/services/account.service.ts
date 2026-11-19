import { db } from '@/lib/data-api';
import { neonAuth } from '@/lib/neon-auth';
import type { Account } from '@/types/models';
import { sanitizeLine } from '@/utils/sanitize';

/** Dados da conta. Cria a linha em public.users se ainda não existir (primeiro acesso). */
export async function getAccount(): Promise<Account> {
  const { data, error } = await db.rpc('ensure_my_account', {}).single();
  if (error) throw error;
  return data;
}

export async function updateFullName(userId: string, fullName: string): Promise<void> {
  const name = sanitizeLine(fullName);
  const { error } = await db.from('users').update({ full_name: name }).eq('id', userId);
  if (error) throw error;
  // Mantém o nome do Neon Auth coerente (não é crítico se falhar).
  await neonAuth.updateName(name).catch(() => undefined);
}

/**
 * Exclusão definitiva da conta: apaga a conta do Neon Auth e, em cascata, os dados associados
 * no banco (função delete_my_account). Depois encerra a sessão no aparelho. As imagens no
 * Cloudinary deixam de ser exibidas e são apagadas pelo script de limpeza.
 */
export async function deleteAccount(): Promise<void> {
  const { error } = await db.rpc('delete_my_account');
  if (error) throw error;
  await neonAuth.clearLocalSession();
}

