'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { tripKeys } from '@/lib/hooks/useTrips';

export function ClientRouterProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Disable Next.js prefetching
    const originalPush = router.push;
    const originalPrefetch = router.prefetch;

    // @ts-ignore - we're intentionally modifying the router
    router.push = (href: string) => {
      // Check if we have data in the cache before navigation
      if (href.includes('/trip/')) {
        const slug = href.split('/').pop();
        const cachedData = queryClient.getQueryData(tripKeys.detail(slug || ''));
        if (!cachedData) {
          // If no cache, let's prefetch before navigation
          queryClient.prefetchQuery({
            queryKey: tripKeys.detail(slug || ''),
            staleTime: Infinity
          });
        }
      }
      originalPush(href);
    };

    // Disable prefetch completely
    // @ts-ignore - we're intentionally modifying the router
    router.prefetch = () => Promise.resolve();

    return () => {
      // @ts-ignore - restore original methods
      router.push = originalPush;
      router.prefetch = originalPrefetch;
    };
  }, [router, queryClient]);

  return <>{children}</>;
}
