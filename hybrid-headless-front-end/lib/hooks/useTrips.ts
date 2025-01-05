import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../api-service';
import type { Trip, ApiResponse } from '../../types/api';

export const tripKeys = {
  all: ['trips'] as const,
  lists: () => [...tripKeys.all, 'list'] as const,
  detail: (slug: string) => [...tripKeys.all, 'detail', slug] as const,
  category: (categorySlug: string) => [...tripKeys.all, 'category', categorySlug] as const,
};

interface TripsResponse {
  data: Trip[];
  success: boolean;
  message?: string;
}

export function useTrips() {
  return useQuery<ApiResponse<Trip[]>>({
    queryKey: tripKeys.lists(),
    queryFn: () => apiService.getTrips(),
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 60, // Keep unused data in cache for 1 hour
  });
}

export function useTrip(slug: string) {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: tripKeys.detail(slug),
    queryFn: async () => {
      // First try to find the trip in the existing trips data
      const tripsData = queryClient.getQueryData<TripsResponse>(tripKeys.lists());
      const existingTrip = tripsData?.data?.find(t => t.slug === slug);
      
      if (existingTrip) {
        return { data: existingTrip, success: true };
      }
      
      // If not found, fetch it individually
      return apiService.getTrip(slug);
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  });
}

export function useTripsByCategory(categorySlug: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: tripKeys.category(categorySlug),
    queryFn: async () => {
      // First try to find trips in this category from existing data
      const tripsData = queryClient.getQueryData<TripsResponse>(tripKeys.lists());
      if (tripsData?.data) {
        const categoryTrips = tripsData.data.filter(trip => 
          trip.categories.some(cat => cat.slug === categorySlug)
        );
        if (categoryTrips.length > 0) {
          return { data: categoryTrips, success: true };
        }
      }
      
      // If not found, fetch category trips
      return apiService.getTripsByCategory(categorySlug);
    },
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
