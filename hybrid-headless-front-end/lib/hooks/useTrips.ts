import { useQuery } from '@tanstack/react-query';
import { apiService } from '../api-service';
import type { Trip } from '../../types/api';

export const tripKeys = {
  all: ['trips'] as const,
  lists: () => [...tripKeys.all, 'list'] as const,
  list: (filters: string) => [...tripKeys.lists(), { filters }] as const,
  details: () => [...tripKeys.all, 'detail'] as const,
  detail: (slug: string) => [...tripKeys.details(), slug] as const,
  categories: () => [...tripKeys.all, 'categories'] as const,
  category: (slug: string) => [...tripKeys.categories(), slug] as const,
};

export function useTrips() {
  return useQuery({
    queryKey: tripKeys.lists(),
    queryFn: () => apiService.getTrips(),
  });
}

export function useTrip(slug: string) {
  return useQuery({
    queryKey: tripKeys.detail(slug),
    queryFn: () => apiService.getTrip(slug),
    enabled: !!slug,
  });
}

export function useTripsByCategory(categorySlug: string) {
  return useQuery({
    queryKey: tripKeys.category(categorySlug),
    queryFn: () => apiService.getTripsByCategory(categorySlug),
    enabled: !!categorySlug,
  });
}
