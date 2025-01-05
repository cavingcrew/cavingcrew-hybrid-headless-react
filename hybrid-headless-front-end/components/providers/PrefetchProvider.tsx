'use client';

import { useEffect } from 'react';
import { usePrefetch } from '@/lib/hooks/usePrefetch';

export function PrefetchProvider({ children }: { children: React.ReactNode }) {
  const { prefetchAll } = usePrefetch();

  useEffect(() => {
    prefetchAll();
  }, []);

  return <>{children}</>;
}
