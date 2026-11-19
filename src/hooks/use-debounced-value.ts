import { useEffect, useState } from 'react';

/** Atualiza o valor somente após `delay` ms sem mudanças (evita consultas a cada tecla). */
export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);
  return debounced;
}
