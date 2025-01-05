import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../api-service';
import type { Trip } from '../../types/api';

export const tripKeys = {
  all: ['trips'] as const,
  lists: () => [...tripKeys.all, 'list'] as const,
  detail: (slug: string) => [...tripKeys.all, 'detail', slug] as const,
  category: (categorySlug: string) => [...tripKeys.all, 'category', categorySlug] as const,
};

export function useTrips() {
  return useQuery({
    queryKey: tripKeys.lists(),
    queryFn: () => apiService.getTrips(),
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 60, // Keep unused data in cache for 1 hour
  });
}

export function useTrip(slug: string) {
  return useQuery({
    queryKey: tripKeys.detail(slug),
    queryFn: () => apiService.getTrip(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  });
}

export function useTripsByCategory(categorySlug: string) {
  return useQuery({
    queryKey: tripKeys.category(categorySlug),
    queryFn: () => apiService.getTripsByCategory(categorySlug),
    enabled: !!categorySlug,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  });
}

export function usePrefetchTrips() {
  const queryClient = useQueryClient();
  
  return {
    prefetchTrips: () => {
      queryClient.prefetchQuery({
        queryKey: tripKeys.lists(),
        queryFn: () => apiService.getTrips(),
        staleTime: 1000 * 60 * 5,
      });
    }
  };
}
