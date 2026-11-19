/// <reference types="jest" />
/* eslint-disable @typescript-eslint/no-require-imports */
// Mocks de módulos nativos usados nos testes (executados em Node, sem aparelho).
// Gestos (react-native-gesture-handler) em Node: mocks oficiais da biblioteca.
require('react-native-gesture-handler/jestSetup');
// No Node não existe o runtime de UI dos worklets: a instalação das ligações nativas dos gestos é desligada.
jest.mock('./node_modules/react-native-gesture-handler/lib/module/handlers/gestures/installUIRuntimeBindings.js', () => ({
  installUIRuntimeBindings: jest.fn(),
}));
jest.mock('@react-native-community/netinfo', () => require('@react-native-community/netinfo/jest/netinfo-mock.js'));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
  };
});
