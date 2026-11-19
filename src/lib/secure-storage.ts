import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Armazenamento seguro usado pela sessão do Neon Auth e por preferências locais.
 *
 * - Android/iOS: Keystore/Keychain via expo-secure-store. Como alguns sistemas
 *   rejeitam valores grandes, o conteúdo é dividido em partes ("chunks").
 * - Web: localStorage (útil apenas para desenvolvimento e testes no navegador).
 */
export type KeyValueStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const CHUNK_SIZE = 1800;

const toSafeKey = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, '_');
const countKey = (base: string) => `${base}.count`;
const chunkKey = (base: string, index: number) => `${base}.${index}`;

async function readChunkCount(base: string): Promise<number | null> {
  const raw = await SecureStore.getItemAsync(countKey(base));
  if (raw === null) return null;
  const count = Number(raw);
  return Number.isInteger(count) && count >= 0 && count < 1000 ? count : null;
}

const nativeStorage: KeyValueStorage = {
  async getItem(key) {
    const base = toSafeKey(key);
    const count = await readChunkCount(base);
    if (count === null) return SecureStore.getItemAsync(base);
    const parts = await Promise.all(
      Array.from({ length: count }, (_, index) => SecureStore.getItemAsync(chunkKey(base, index))),
    );
    return parts.some((part) => part === null) ? null : parts.join('');
  },

  async setItem(key, value) {
    const base = toSafeKey(key);
    await nativeStorage.removeItem(key);
    const chunks: string[] = [];
    for (let start = 0; start < value.length; start += CHUNK_SIZE) {
      chunks.push(value.slice(start, start + CHUNK_SIZE));
    }
    if (chunks.length === 0) chunks.push('');
    await Promise.all(chunks.map((chunk, index) => SecureStore.setItemAsync(chunkKey(base, index), chunk)));
    await SecureStore.setItemAsync(countKey(base), String(chunks.length));
  },

  async removeItem(key) {
    const base = toSafeKey(key);
    const count = (await readChunkCount(base)) ?? 0;
    await Promise.all([
      ...Array.from({ length: count }, (_, index) => SecureStore.deleteItemAsync(chunkKey(base, index))),
      SecureStore.deleteItemAsync(countKey(base)),
      SecureStore.deleteItemAsync(base),
    ]);
  },
};

const webStorage: KeyValueStorage = {
  async getItem(key) {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  async setItem(key, value) {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // Armazenamento indisponível (ex.: navegação privada) — a sessão dura só esta aba.
    }
  },
  async removeItem(key) {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // ignora
    }
  },
};

export const secureStorage: KeyValueStorage = Platform.OS === 'web' ? webStorage : nativeStorage;

/** Preferências simples do app (não sensíveis). */
export const preferences = {
  async getFlag(key: string): Promise<boolean> {
    try {
      return (await secureStorage.getItem(`hub.pref.${key}`)) === '1';
    } catch {
      return false;
    }
  },
  async setFlag(key: string, value: boolean): Promise<void> {
    try {
      if (value) await secureStorage.setItem(`hub.pref.${key}`, '1');
      else await secureStorage.removeItem(`hub.pref.${key}`);
    } catch {
      // ignora: preferência é apenas conveniência
    }
  },
};
