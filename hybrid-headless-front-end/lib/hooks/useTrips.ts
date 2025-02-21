import { useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { apiService } from '../api-service';
import type { Trip, ApiResponse, CategoryResponse } from '../../types/api';

export const tripKeys = {
  all: ['trips'] as const,
  detail: (slug: string) => [...tripKeys.all, 'detail', slug] as const,
  category: (categorySlug: string) => [...tripKeys.all, 'category', categorySlug] as const,
  lists: () => [...tripKeys.all, 'list'] as const,
};

interface TripsResponse {
  data: Trip[];
  success: boolean;
  message?: string;
}

export function useTrips(): UseQueryResult<ApiResponse<Trip[]>> {
  const queryClient = useQueryClient();

  return useQuery<ApiResponse<Trip[]>>({
    queryKey: tripKeys.all,
    queryFn: async () => {
      // Initial empty state for instant render
      const initialEmptyState = { success: true, data: [], timestamp: Date.now() };
      
      // Initial cached request
      const cachedResponse = await apiService.getTrips(true);
      
      // Queue background refresh
      queryClient.fetchQuery({
        queryKey: [...tripKeys.all, 'fresh'],
        queryFn: async () => {
          const freshData = await apiService.getTrips(false);
          queryClient.setQueryData(tripKeys.all, (old: any) => ({
            ...freshData,
            // Preserve timestamp if data is similar
            timestamp: isDataStale(old?.data, freshData.data) ? Date.now() : old?.timestamp
          }));
          return freshData;
        },
        staleTime: 0
      });

      // Return cached response or empty state
      return cachedResponse.success ? cachedResponse : initialEmptyState;
    },
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: (query) => {
      const dataAge = Date.now() - (query.state.data?.timestamp || 0);
      return dataAge > 1000 * 30; // Only refetch if data older than 30s
    },
    refetchOnReconnect: true,
    refetchOnMount: true,
    placeholderData: { success: true, data: [], timestamp: 0 } // Instant initial render
  });
}

export function useTrip(slug: string) {
  const { data: tripsData } = useTrips();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: tripKeys.detail(slug),
    queryFn: async () => {
      // First check main trips list
      const cachedTrip = tripsData?.data?.find(t => t.slug === slug);
      if (cachedTrip) return { data: cachedTrip, success: true };

      // Fallback to direct fetch
      return apiService.getTrip(slug);
    },
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 60 * 24,
    enabled: !!slug,
    refetchOnWindowFocus: (query) => {
      const dataAge = Date.now() - (query.state.data?.timestamp || 0);
      return dataAge > 1000 * 30;
    },
    placeholderData: { // Instant trip page skeleton
      data: {
        id: -1,
        slug,
        name: '',
        acf: {},
        categories: [],
        variations: [],
        images: []
      } as unknown as Trip,
      success: true,
      timestamp: 0
    }
  });
}

export function useTripsByCategory(categorySlug: string) {
  return useQuery<ApiResponse<CategoryResponse>>({
    queryKey: tripKeys.category(categorySlug),
    queryFn: async () => {
      try {
        const response = await apiService.getTripsByCategory(categorySlug);

        if (!response.success || !response.data) {
          return {
            success: false,
            data: null,
            message: response.message || 'Failed to fetch category trips'
          };
        }

        const filteredData = response.data
          .map(trip => ({
            ...trip,
            categories: trip.categories || []
          }));

        return {
          success: true,
          data: {
            products: filteredData,
            category: {
              name: categorySlug.replace(/-/g, ' '),
              slug: categorySlug
            }
          }
        };
      } catch (error) {
        return {
          success: false,
          data: null,
          message: error instanceof Error ? error.message : 'Failed to fetch category trips'
        };
      }
    },
    enabled: !!categorySlug,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  });
}

// Helper to check data freshness
function isDataStale(oldData: Trip[], newData: Trip[]): boolean {
  if (!oldData || !newData) return true;
  if (oldData.length !== newData.length) return true;
  return oldData.some((trip, index) => trip.id !== newData[index]?.id);
}

export const useCategoryTrips = useTripsByCategory;
