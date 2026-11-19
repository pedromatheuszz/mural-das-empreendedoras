import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';

import { env, isCloudinaryConfigured } from '@/lib/env';
import { AppError } from '@/utils/errors';

/**
 * Imagens dos perfis no Cloudinary (envio direto do app com um "upload preset" não assinado).
 * A chave secreta do Cloudinary NUNCA vai para o app: imagens substituídas ou de contas
 * excluídas são apagadas pelo script scripts/cloudinary-cleanup.mjs.
 */
export type ImageKind = 'logo' | 'photo';

/** Tamanho máximo (px) de cada tipo de imagem. Imagens são quadradas. */
const MAX_DIMENSION: Record<ImageKind, number> = { logo: 800, photo: 640 };
const MAX_BYTES = 5 * 1024 * 1024;
/** Pasta de cada usuária no Cloudinary: mural/users/<id da conta>/ */
export const userFolder = (userId: string) => `mural/users/${userId}`;

export function isLocalImage(uri: string | null | undefined): uri is string {
  return typeof uri === 'string' && uri.length > 0 && !/^https?:\/\//i.test(uri);
}

/** Reduz e comprime a imagem escolhida antes do envio (economia de dados e de armazenamento). */
export async function optimizeImage(uri: string, kind: ImageKind, width?: number): Promise<string> {
  const target = Math.min(width && width > 0 ? width : MAX_DIMENSION[kind], MAX_DIMENSION[kind]);
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width: target, height: null });
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
  return result.uri;
}

/** Tokens para desfazer envios recentes (valem 10 minutos no Cloudinary). */
const deleteTokens = new Map<string, string>();

type CloudinaryUpload = { secure_url?: string; delete_token?: string; bytes?: number; error?: { message?: string } };

export async function uploadProfileImage(userId: string, localUri: string, kind: ImageKind): Promise<string> {
  if (!isCloudinaryConfigured) {
    throw new AppError('O envio de imagens ainda não foi configurado. Salve o perfil sem imagem por enquanto.');
  }
  const name = `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const form = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(localUri)).blob();
    if (blob.size > MAX_BYTES) throw new AppError('A imagem é grande demais. Escolha uma imagem menor que 5 MB.');
    form.append('file', blob, name);
  } else {
    // React Native envia o arquivo direto do disco, sem carregá-lo na memória do JS.
    form.append('file', { uri: localUri, name, type: 'image/jpeg' } as unknown as Blob);
  }
  form.append('upload_preset', env.cloudinaryUploadPreset);
  form.append('folder', userFolder(userId));
  // O token para desfazer o envio só vem se o preset tiver "Return delete token" ligado.

  let response: Response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/image/upload`, {
      method: 'POST',
      body: form,
    });
  } catch {
    throw new AppError('Não foi possível enviar a imagem. Verifique sua internet e tente novamente.');
  }
  const data = (await response.json().catch(() => ({}))) as CloudinaryUpload;
  if (!response.ok || !data.secure_url) {
    const message = data.error?.message ?? '';
    if (/file size too large|too large/i.test(message)) {
      throw new AppError('A imagem é grande demais. Escolha uma imagem menor que 5 MB.');
    }
    if (/format|invalid image/i.test(message)) {
      throw new AppError('Formato de imagem não suportado. Use JPG, PNG ou WEBP.');
    }
    throw new AppError('Não foi possível enviar a imagem. Tente novamente em instantes.');
  }
  if (data.delete_token) deleteTokens.set(data.secure_url, data.delete_token);
  return data.secure_url;
}

/**
 * Desfaz envios feitos agora há pouco (ex.: o perfil não foi salvo). Imagens antigas,
 * sem token, ficam para o script de limpeza. Melhor esforço: nunca bloqueia a usuária.
 */
export async function removeImages(urls: (string | null | undefined)[]): Promise<void> {
  if (!isCloudinaryConfigured) return;
  await Promise.all(
    urls.map(async (url) => {
      const token = url ? deleteTokens.get(url) : undefined;
      if (!url || !token) return;
      deleteTokens.delete(url);
      try {
        const form = new FormData();
        form.append('token', token);
        await fetch(`https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/delete_by_token`, {
          method: 'POST',
          body: form,
        });
      } catch {
        // ignora
      }
    }),
  );
}
