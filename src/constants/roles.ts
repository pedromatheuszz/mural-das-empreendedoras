import type { RoleName } from '@/types/database';

export type { RoleName };

/**
 * Cargos do app e o que cada um pode fazer.
 *
 * ESPELHO das regras do banco (database/migrations/20261119000800_member_roles.sql): o app usa
 * esta matriz só para mostrar ou esconder botões. Quem garante a permissão é o banco (RLS e
 * gatilhos) — mudar algo aqui sem mudar a migration não libera nada.
 */
export const ROLE_INFO: Record<RoleName, { label: string; description: string }> = {
  developer: {
    label: 'Desenvolvedor',
    description: 'Acesso total: edita e exclui qualquer perfil, modera e gerencia os cargos.',
  },
  administrator: {
    label: 'Administradora',
    description: 'Admin do grupo: modera perfis, analisa denúncias e cuida dos perfis do grupo.',
  },
  entrepreneur: {
    label: 'Empreendedora',
    description: 'Integrante do grupo: divulga o próprio negócio e denuncia perfis irregulares.',
  },
};

export const PERMISSIONS = {
  /** Ver perfis fora do Mural (rascunhos, retirados, suspensos). */
  viewHiddenProfiles: ['developer', 'administrator'],
  /** Suspender e reativar qualquer perfil. */
  moderateProfiles: ['developer', 'administrator'],
  /** Ver e resolver denúncias. */
  manageReports: ['developer', 'administrator'],
  /** Editar e excluir os perfis do grupo (cadastrados pela organização, sem conta). */
  manageGroupProfiles: ['developer', 'administrator'],
  /** Editar o conteúdo do perfil de outra empreendedora. */
  editAnyProfile: ['developer'],
  /** Excluir o perfil de outra empreendedora. */
  deleteAnyProfile: ['developer'],
  /** Atribuir e remover cargos. */
  manageRoles: ['developer'],
} as const satisfies Record<string, readonly RoleName[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: RoleName | undefined, permission: Permission): boolean {
  return role !== undefined && (PERMISSIONS[permission] as readonly RoleName[]).includes(role);
}

/** Pode abrir o painel da equipe (denúncias e, para o desenvolvedor, cargos). */
export const isStaff = (role: RoleName | undefined) => can(role, 'manageReports');

/** O que esta conta pode fazer com um perfil específico. */
export function profileAbilities(
  role: RoleName | undefined,
  profile: { user_id: string | null },
  userId: string | undefined,
) {
  const isOwner = Boolean(userId && profile.user_id === userId);
  const isGroupProfile = profile.user_id === null;
  return {
    isOwner,
    canEdit: !isOwner && (can(role, 'editAnyProfile') || (isGroupProfile && can(role, 'manageGroupProfiles'))),
    canDelete: !isOwner && (can(role, 'deleteAnyProfile') || (isGroupProfile && can(role, 'manageGroupProfiles'))),
    canModerate: can(role, 'moderateProfiles'),
  };
}
