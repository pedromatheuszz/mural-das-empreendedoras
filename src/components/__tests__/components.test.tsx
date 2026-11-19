import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/feedback/toast-provider';
import { ProfileCard } from '@/components/profiles/profile-card';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import type { ProfileSummary } from '@/types/models';

const metrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function Providers({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider initialMetrics={metrics}>
      <ToastProvider>{children}</ToastProvider>
    </SafeAreaProvider>
  );
}

const profile: ProfileSummary = {
  id: 'p1',
  business_name: 'Doces da Ana',
  entrepreneur_name: 'Ana Souza',
  service_description: 'Bolos decorados e doces finos por encomenda.',
  logo_url: null,
  profile_image_url: null,
  category: 'gastronomia',
  city: 'Joinville',
  state: 'SC',
  serves_nationwide: true,
  contact_url: 'https://wa.me/5547999998888',
};

describe('ProfileCard', () => {
  it('mostra as informações públicas e abre o perfil completo', async () => {
    const onPress = jest.fn();
    await render(<ProfileCard profile={profile} onPress={onPress} />, { wrapper: Providers });

    expect(screen.getByText('Doces da Ana')).toBeTruthy();
    expect(screen.getByText('por Ana Souza')).toBeTruthy();
    expect(screen.getByText('Gastronomia & Doces')).toBeTruthy();
    expect(screen.getByText('Joinville, SC')).toBeTruthy();
    expect(screen.getByText('Todo o Brasil')).toBeTruthy();
    expect(screen.getByLabelText('Chamar Doces da Ana no WhatsApp')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Ver perfil de Doces da Ana'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('não exibe o botão de WhatsApp quando o contato é outro link', async () => {
    await render(<ProfileCard profile={{ ...profile, contact_url: 'https://calendly.com/ana' }} onPress={jest.fn()} />, {
      wrapper: Providers,
    });
    expect(screen.queryByLabelText('Chamar Doces da Ana no WhatsApp')).toBeNull();
  });
});

describe('componentes base', () => {
  it('Button bloqueia toques quando desabilitado', async () => {
    const onPress = jest.fn();
    await render(<Button title="Salvar" onPress={onPress} disabled />);
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('TextField exibe rótulo, contador e erro acessíveis', async () => {
    await render(<TextField label="Nome da marca" value="Doces" maxLength={80} showCounter error="Campo obrigatório" />);
    expect(screen.getByText('5/80')).toBeTruthy();
    expect(screen.getByText('Campo obrigatório')).toBeTruthy();
    expect(screen.getByLabelText('Nome da marca')).toBeTruthy();
  });
});
