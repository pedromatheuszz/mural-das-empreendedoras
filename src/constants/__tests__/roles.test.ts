import { can, isStaff, profileAbilities } from '../roles';

const ME = 'conta-1';
const groupProfile = { user_id: null };
const someoneElse = { user_id: 'conta-2' };
const mine = { user_id: ME };

describe('cargos e permissões (espelho das regras do banco)', () => {
  it('empreendedora não tem permissões da equipe', () => {
    expect(isStaff('entrepreneur')).toBe(false);
    expect(can('entrepreneur', 'moderateProfiles')).toBe(false);
    expect(profileAbilities('entrepreneur', groupProfile, ME)).toMatchObject({ canEdit: false, canDelete: false, canModerate: false });
  });

  it('administradora modera tudo, mas só edita/exclui perfis do grupo', () => {
    expect(isStaff('administrator')).toBe(true);
    expect(can('administrator', 'manageRoles')).toBe(false);
    expect(profileAbilities('administrator', groupProfile, ME)).toMatchObject({ canEdit: true, canDelete: true, canModerate: true });
    expect(profileAbilities('administrator', someoneElse, ME)).toMatchObject({ canEdit: false, canDelete: false, canModerate: true });
  });

  it('desenvolvedor edita e exclui qualquer perfil e gerencia cargos', () => {
    expect(can('developer', 'manageRoles')).toBe(true);
    expect(profileAbilities('developer', someoneElse, ME)).toMatchObject({ canEdit: true, canDelete: true, canModerate: true });
  });

  it('o próprio perfil é gerenciado pela aba Meu Perfil, não pelo painel', () => {
    expect(profileAbilities('developer', mine, ME)).toMatchObject({ isOwner: true, canEdit: false, canDelete: false });
  });

  it('enquanto o cargo carrega, nada extra é liberado', () => {
    expect(isStaff(undefined)).toBe(false);
    expect(profileAbilities(undefined, groupProfile, ME)).toMatchObject({ canEdit: false, canDelete: false, canModerate: false });
  });
});
