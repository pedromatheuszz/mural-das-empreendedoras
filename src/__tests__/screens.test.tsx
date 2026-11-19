import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import HubScreen from '@/app/(tabs)/hub';
import SignInScreen from '@/app/(auth)/sign-in';
import { getAccount } from '@/services/account.service';
import { signIn } from '@/services/auth.service';
import { getMyProfile, listHubProfiles, listRecentProfiles } from '@/services/profiles.service';
import type { ProfileSummary } from '@/types/models';

import { createWrapper } from '@/testing/providers';

jest.mock('@/services/auth.service', () => ({
  signIn: jest.fn(async () => undefined),
  resendSignUpCode: jest.fn(async () => undefined),
}));

jest.mock('@/services/profiles.service', () => ({
  listHubProfiles: jest.fn(),
  listRecentProfiles: jest.fn(),
  getMyProfile: jest.fn(),
  searchProfiles: jest.fn(),
  getPublicProfile: jest.fn(),
  createProfile: jest.fn(),
  updateProfile: jest.fn(),
  setPublicationStatus: jest.fn(),
  deleteProfile: jest.fn(),
}));

jest.mock('@/services/account.service', () => ({
  getAccount: jest.fn(),
  updateFullName: jest.fn(),
  deleteAccount: jest.fn(),
}));

jest.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 'ana@exemplo.com' }, isSignedIn: true, isLoading: false }),
}));

const summary = (overrides: Partial<ProfileSummary>): ProfileSummary => ({
  id: 'id',
  business_name: 'Marca',
  entrepreneur_name: 'Empreendedora',
  service_description: 'Descrição dos serviços oferecidos pela empreendedora.',
  logo_url: null,
  profile_image_url: null,
  category: null,
  city: null,
  state: null,
  serves_nationwide: false,
  contact_url: null,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getAccount).mockResolvedValue({
    id: 'user-1',
    full_name: 'Ana Souza',
    email: 'ana@exemplo.com',
    terms_accepted_at: null,
    terms_version: null,
    created_at: '2026-11-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
  });
});

describe('Login', () => {
  it('valida os campos e entra com e-mail e senha', async () => {
    await render(<SignInScreen />, { wrapper: createWrapper() });

    await fireEvent.press(screen.getByTestId('sign-in-submit'));
    expect(await screen.findByText('Informe seu e-mail.')).toBeTruthy();
    expect(screen.getByText('Informe sua senha.')).toBeTruthy();
    expect(signIn).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText('E-mail'), 'ana@exemplo.com');
    await fireEvent.changeText(screen.getByLabelText('Senha'), 'segura123');
    await fireEvent.press(screen.getByTestId('sign-in-submit'));

    await waitFor(() => expect(signIn).toHaveBeenCalledWith({ email: 'ana@exemplo.com', password: 'segura123' }));
  });
});

describe('Mural das Empreendedoras', () => {
  it('lista perfis publicados, destaques e convite para divulgar', async () => {
    jest.mocked(listHubProfiles).mockResolvedValue({
      items: [
        summary({ id: 'a', business_name: 'Ateliê Luma', entrepreneur_name: 'Luma Reis', category: 'moda' }),
        summary({ id: 'b', business_name: 'Doces da Ana', entrepreneur_name: 'Ana Souza', city: 'Joinville', state: 'SC' }),
      ],
      nextPage: undefined,
    });
    jest.mocked(listRecentProfiles).mockResolvedValue([summary({ id: 'c', business_name: 'Studio Novo' })]);
    jest.mocked(getMyProfile).mockResolvedValue(null);

    await render(<HubScreen />, { wrapper: createWrapper() });

    expect(screen.getByText('Mural das Empreendedoras')).toBeTruthy();
    expect(await screen.findByText('Ateliê Luma')).toBeTruthy();
    expect(screen.getByText('Doces da Ana')).toBeTruthy();
    expect(await screen.findByText('Studio Novo')).toBeTruthy();
    expect(await screen.findByText('Você também tem um negócio?')).toBeTruthy();
    expect(screen.getByText(/, Ana$/)).toBeTruthy();
    expect(listHubProfiles).toHaveBeenCalledWith({ page: 0, category: null });
  });

  it('mostra estado vazio com orientação quando não há perfis', async () => {
    jest.mocked(listHubProfiles).mockResolvedValue({ items: [], nextPage: undefined });
    jest.mocked(listRecentProfiles).mockResolvedValue([]);
    jest.mocked(getMyProfile).mockResolvedValue(null);

    await render(<HubScreen />, { wrapper: createWrapper() });

    expect(await screen.findByText('O Mural está começando!')).toBeTruthy();
    expect(screen.getByText('Divulgar minha marca')).toBeTruthy();
  });

  it('mostra erro de conexão com opção de tentar novamente', async () => {
    jest.mocked(listHubProfiles).mockRejectedValue(new TypeError('Network request failed'));
    jest.mocked(listRecentProfiles).mockResolvedValue([]);
    jest.mocked(getMyProfile).mockResolvedValue(null);

    await render(<HubScreen />, { wrapper: createWrapper() });

    expect(await screen.findByText('Sem conexão')).toBeTruthy();
    expect(screen.getByText('Tentar novamente')).toBeTruthy();
  });
});
