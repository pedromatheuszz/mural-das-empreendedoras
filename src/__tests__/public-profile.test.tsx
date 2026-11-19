import { render, screen } from '@testing-library/react-native';

import EntrepreneurProfileScreen from '@/app/entrepreneur/[id]';
import { getPublicProfile } from '@/services/profiles.service';
import { createWrapper } from '@/testing/providers';
import type { PublicProfile } from '@/types/models';

const PROFILE_ID = '00000000-0000-4000-8000-000000000001';

jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  useLocalSearchParams: () => ({ id: '00000000-0000-4000-8000-000000000001' }),
}));

jest.mock('@/services/profiles.service', () => ({
  getPublicProfile: jest.fn(),
  getMyProfile: jest.fn(),
  listHubProfiles: jest.fn(),
  listRecentProfiles: jest.fn(),
  searchProfiles: jest.fn(),
  createProfile: jest.fn(),
  updateProfile: jest.fn(),
  setPublicationStatus: jest.fn(),
  deleteProfile: jest.fn(),
}));

jest.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({ user: { id: 'user-1' }, isSignedIn: true, isLoading: false }),
}));

const curatedProfile: PublicProfile = {
  id: PROFILE_ID,
  user_id: null,
  business_name: 'Camii Sabores e Camadas',
  entrepreneur_name: 'Camila',
  service_description: 'Venda de empadão artesanal.',
  logo_url: null,
  profile_image_url: null,
  category: 'gastronomia',
  city: 'Joinville',
  state: 'SC',
  serves_nationwide: false,
  contact_url: null,
  instagram_url: 'https://www.instagram.com/camii_sabores_e_camadas',
  website_url: null,
  community_perks: [],
  publication_status: 'published',
  published_at: '2026-11-18T12:00:00Z',
};

describe('Perfil público de integrante do grupo', () => {
  it('mostra o selo do grupo, o Instagram e a opção de denunciar', async () => {
    jest.mocked(getPublicProfile).mockResolvedValue(curatedProfile);

    await render(<EntrepreneurProfileScreen />, { wrapper: createWrapper() });

    expect(await screen.findByText('Camii Sabores e Camadas')).toBeTruthy();
    expect(screen.getByText('por Camila')).toBeTruthy();
    expect(screen.getByText('Perfil divulgado pelo grupo Joinville Empreendedoras.')).toBeTruthy();
    expect(screen.getByText('Conheça o grupo: @joinvilleempreendedoras')).toBeTruthy();
    expect(screen.getByText('Ver no Instagram')).toBeTruthy();
    expect(screen.getByLabelText('Denunciar este perfil')).toBeTruthy();
    expect(screen.queryByLabelText('Editar meu perfil')).toBeNull();
  });
});
