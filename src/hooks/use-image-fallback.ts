import { useState } from 'react';

/**
 * Se a imagem falhar ao carregar (link quebrado, sem internet), devolve null para o
 * componente mostrar o monograma no lugar de um espaço vazio.
 */
export function useImageFallback(uri: string | null | undefined) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  return {
    uri: uri && uri !== failedUri ? uri : null,
    onError: () => setFailedUri(uri ?? null),
  };
}
