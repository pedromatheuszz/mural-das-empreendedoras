import { Redirect } from 'expo-router';
import { View } from 'react-native';

import { colors } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';
import { useOnboarding } from '@/providers/onboarding-provider';

/** Ponto de entrada: decide entre onboarding, login e o Mural. */
export default function Index() {
  const { isLoading, isSignedIn } = useAuth();
  const { done } = useOnboarding();

  if (isLoading || done === null) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }
  if (isSignedIn) return <Redirect href="/hub" />;
  return <Redirect href={done ? '/sign-in' : '/onboarding'} />;
}
