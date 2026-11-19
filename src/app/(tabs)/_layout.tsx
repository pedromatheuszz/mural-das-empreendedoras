import { Tabs } from 'expo-router';

import { BlurTargetsProvider, ScreenBlurTarget, TabBar } from '@/components/navigation/tab-bar';
import { colors } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <BlurTargetsProvider>
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenLayout={({ children, route }) => <ScreenBlurTarget routeKey={route.key}>{children}</ScreenBlurTarget>}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        <Tabs.Screen name="hub" options={{ title: 'Início' }} />
        <Tabs.Screen name="search" options={{ title: 'Buscar' }} />
        <Tabs.Screen name="publish" options={{ title: 'Divulgar' }} />
        <Tabs.Screen name="config" options={{ title: 'Ajustes' }} />
        <Tabs.Screen name="me" options={{ title: 'Meu Perfil' }} />
      </Tabs>
    </BlurTargetsProvider>
  );
}
