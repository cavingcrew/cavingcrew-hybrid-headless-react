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
  return useQuery<ApiResponse<Trip[]>>({
    queryKey: tripKeys.all,
    queryFn: async () => {
      const response = await apiService.getTrips();
      if (response.success && response.data) {
        // Transform the data structure
        const trips = Array.isArray(response.data.products) ?
          response.data.products :
          [];

        // Filter out the membership product and transform the data
        const filteredData = trips
          .filter((trip: Trip) => trip.id !== 1272)
          .map((trip: Trip) => ({
            ...trip,
            // Ensure categories is always an array
            categories: trip.categories || []
          }));

        return {
          success: true,
          data: filteredData
        };
      }
      return {
        success: false,
        data: [],
        message: response.message || 'Failed to fetch trips'
      };
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  });
}

export function useTrip(slug: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: tripKeys.detail(slug),
    queryFn: async () => {
      // Check list cache first
      const listData = queryClient.getQueryData<ApiResponse<Trip[]>>(tripKeys.all);
      const cachedTrip = listData?.data?.find(t => t.slug === slug);
      
      if (cachedTrip) {
        // Prefetch fresh data in background
        queryClient.prefetchQuery({
          queryKey: tripKeys.detail(slug),
          queryFn: () => apiService.getTrip(slug)
        });
        return { data: cachedTrip, success: true };
      }
      
      // Fallback to API call
      return apiService.getTrip(slug);
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
    enabled: !!slug,
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

        // Transform the data structure
        const filteredData = response.data.filter(trip => trip.id !== 1272)
          .map(trip => ({
            ...trip,
            categories: trip.categories || [] // Ensure categories array exists
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

export const useCategoryTrips = useTripsByCategory;
