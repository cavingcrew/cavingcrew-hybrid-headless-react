'use client';

import { useEffect } from 'react';
import { usePrefetch } from '@/lib/hooks/usePrefetch';

export function PrefetchProvider({ children }: { children: React.ReactNode }) {
  const { prefetchAll } = usePrefetch();

  useEffect(() => {
    // Only prefetch in production
    if (process.env.NODE_ENV === 'production') {
      prefetchAll();
    }
  }, []);

  return <>{children}</>;
}
