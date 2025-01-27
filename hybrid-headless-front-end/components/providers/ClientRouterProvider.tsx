'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';
import { tripKeys } from '@/lib/hooks/useTrips';

export function ClientRouterProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Intercept all navigation events
    const handleClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      // Don't intercept external links or special routes
      if (
        href.startsWith('http') ||
        href.startsWith('/wp-') ||
        href.startsWith('/my-account') ||
        href.includes('checkout') ||
        href.includes('cart')
      ) {
        return;
      }

      e.preventDefault();

      // Handle trip detail pages
      if (href.startsWith('/trip/')) {
        const slug = href.split('/').pop();
        const cachedData = queryClient.getQueryData(tripKeys.detail(slug || ''));
        
        // If we have cached data, use it immediately
        if (cachedData) {
          router.push(href);
          return;
        }

        // If no cache, prefetch and then navigate
        queryClient.prefetchQuery({
          queryKey: tripKeys.detail(slug || ''),
          staleTime: Infinity
        }).then(() => {
          router.push(href);
        });
        return;
      }

      // Handle trips listing page
      if (href === '/trips' || href === '/trips/') {
        const cachedData = queryClient.getQueryData(tripKeys.all);
        if (cachedData) {
          router.push(href);
          return;
        }

        // If no cache, prefetch and then navigate
        queryClient.prefetchQuery({
          queryKey: tripKeys.all,
          staleTime: Infinity
        }).then(() => {
          router.push(href);
        });
        return;
      }

      // Default navigation
      router.push(href);
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [router, queryClient]);

  return <>{children}</>;
}
