import { useRef } from 'react';

import { useTabScrollToTop } from '@/components/navigation/tab-bar';
import type { ScrollHandle } from '@/components/ui/screen';

/**
 * Para abas com <Screen scroll>: tocar de novo na aba já aberta volta ao topo da tela.
 * Uso: const scrollRef = useScreenScrollToTop(); <Screen scroll scrollRef={scrollRef}>.
 */
export function useScreenScrollToTop() {
  const scrollRef = useRef<ScrollHandle>(null);
  useTabScrollToTop(scrollRef);
  return scrollRef;
}
