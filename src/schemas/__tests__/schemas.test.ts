import type { EntrepreneurProfile } from '@/types/models';

import { changePasswordSchema, deleteAccountSchema, signInSchema, signUpSchema } from '../auth.schema';
import { emptyProfileForm, profileFormSchema, profileToFormValues, toProfilePayload } from '../profile.schema';
import { reportSchema } from '../report.schema';

const issuesByPath = (result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
  Object.fromEntries((result.error?.issues ?? []).map((issue) => [issue.path.join('.'), issue.message]));

describe('cadastro de conta', () => {
  const valid = {
    fullName: 'Ana Souza',
    email: ' Ana@Exemplo.com ',
    password: 'segura123',
    confirmPassword: 'segura123',
    acceptTerms: true,
    confirmAge: true,
  };

  it('aceita dados válidos', () => {
    const result = signUpSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe('Ana@Exemplo.com');
  });

  it('valida nome, e-mail, senha, termos e idade', () => {
    const result = signUpSchema.safeParse({
      fullName: 'Ana',
      email: 'ana@',
      password: 'abcdefgh',
      confirmPassword: 'outra',
      acceptTerms: false,
      confirmAge: false,
    });
    const issues = issuesByPath(result);
    expect(issues.fullName).toMatch(/nome e sobrenome/);
    expect(issues.email).toMatch(/e-mail válido/);
    expect(issues.password).toMatch(/número/);
    expect(issues.confirmPassword).toMatch(/não coincidem/);
    expect(issues.acceptTerms).toMatch(/Termos de Uso/);
    expect(issues.confirmAge).toMatch(/18 anos/);
  });

  it('login exige e-mail e senha', () => {
    const issues = issuesByPath(signInSchema.safeParse({ email: '', password: '' }));
    expect(issues.email).toBe('Informe seu e-mail.');
    expect(issues.password).toBe('Informe sua senha.');
  });

  it('troca de senha exige senha nova diferente da atual', () => {
    const issues = issuesByPath(
      changePasswordSchema.safeParse({ currentPassword: 'segura123', password: 'segura123', confirmPassword: 'segura123' }),
    );
    expect(issues.password).toMatch(/diferente da atual/);
  });

  it('exclusão de conta exige digitar EXCLUIR', () => {
    expect(deleteAccountSchema.safeParse({ confirmation: 'excluir' }).success).toBe(true);
    expect(deleteAccountSchema.safeParse({ confirmation: 'sim' }).success).toBe(false);
  });
});

describe('perfil empresarial', () => {
  const valid = {
    ...emptyProfileForm('Ana Souza'),
    businessName: 'Doces da Ana',
    serviceDescription: 'Bolos decorados e doces finos por encomenda em Joinville.',
    category: 'gastronomia' as const,
  };

  it('aceita somente os campos obrigatórios preenchidos', () => {
    expect(profileFormSchema.safeParse(valid).success).toBe(true);
  });

  it('valida obrigatórios, limites e links', () => {
    const issues = issuesByPath(
      profileFormSchema.safeParse({
        ...valid,
        businessName: 'A',
        entrepreneurName: '',
        serviceDescription: 'Curto demais',
        city: 'J',
        social: '@nome inválido',
        contact: '1234',
        website: 'javascript:alert(1)',
      }),
    );
    expect(issues.businessName).toBeDefined();
    expect(issues.entrepreneurName).toBeDefined();
    expect(issues.serviceDescription).toMatch(/20 caracteres/);
    expect(issues.city).toBeDefined();
    expect(issues.social).toBeDefined();
    expect(issues.contact).toMatch(/WhatsApp/);
    expect(issues.website).toBeDefined();
  });

  it('limita a descrição a 1.500 caracteres', () => {
    expect(profileFormSchema.safeParse({ ...valid, serviceDescription: 'a'.repeat(1501) }).success).toBe(false);
  });

  it('normaliza os dados antes de salvar', () => {
    const payload = toProfilePayload({
      ...valid,
      businessName: '  Doces   da Ana ',
      city: ' Joinville ',
      state: 'SC',
      social: '@doces.da.ana',
      contact: '(47) 99999-8888',
      website: 'docesdaana.com.br',
      communityPerks: ['hub-discount', 'hub-discount'],
    });
    expect(payload).toMatchObject({
      business_name: 'Doces da Ana',
      city: 'Joinville',
      state: 'SC',
      instagram_url: 'https://instagram.com/doces.da.ana',
      contact_url: 'https://wa.me/5547999998888',
      website_url: 'https://docesdaana.com.br',
      community_perks: ['hub-discount'],
      category: 'gastronomia',
    });
  });

  it('converte o perfil salvo de volta para o formulário', () => {
    const profile = {
      business_name: 'Doces da Ana',
      entrepreneur_name: 'Ana Souza',
      service_description: 'Bolos decorados e doces finos por encomenda em Joinville.',
      category: 'gastronomia',
      city: 'Joinville',
      state: 'SC',
      instagram_url: 'https://instagram.com/doces.da.ana',
      contact_url: 'https://wa.me/5547999998888',
      website_url: null,
      logo_url: null,
      profile_image_url: 'https://cdn.exemplo.com/foto.jpg',
      serves_nationwide: true,
      community_perks: ['local-delivery', 'perk-antiga'],
    } as unknown as EntrepreneurProfile;
    expect(profileToFormValues(profile)).toMatchObject({
      social: '@doces.da.ana',
      contact: '(47) 99999-8888',
      website: '',
      photoUri: 'https://cdn.exemplo.com/foto.jpg',
      communityPerks: ['local-delivery'],
      servesNationwide: true,
    });
  });
});

describe('denúncia', () => {
  it('exige detalhes quando o motivo é "outro"', () => {
    expect(reportSchema.safeParse({ reason: 'spam', details: '' }).success).toBe(true);
    const issues = issuesByPath(reportSchema.safeParse({ reason: 'other', details: 'curto' }));
    expect(issues.details).toMatch(/10 caracteres/);
  });
});
