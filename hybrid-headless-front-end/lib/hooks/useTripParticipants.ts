'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../api-service';
import { userKeys } from './useUser';
import { tripKeys } from './useTrips';
import type { ApiResponse, TripParticipant, TripParticipantsResponse } from '../../types/api';

export const participantKeys = {
  all: ['participants'] as const,
  lists: () => [...participantKeys.all, 'list'] as const,
  list: (tripId: number) => [...participantKeys.lists(), tripId] as const,
};

export function useTripParticipants(tripId: number) {
  const queryClient = useQueryClient();

  return useQuery<ApiResponse<TripParticipantsResponse>>({
    queryKey: participantKeys.list(tripId),
    queryFn: async () => {
      try {
        console.log('[useTripParticipants] Fetching participants for trip', tripId);
        const response = await apiService.getTripParticipants(tripId);
        console.log('[useTripParticipants] Response:', response);
        return response;
      } catch (error) {
        console.error('[useTripParticipants] Error:', error);
        return {
          success: false,
          data: null,
          message: error instanceof Error ? error.message : 'Failed to fetch trip participants'
        };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    enabled: !!tripId,
  });
}

// Hook to invalidate participants cache
export function useInvalidateParticipants() {
  const queryClient = useQueryClient();

  const invalidateParticipants = (tripId?: number) => {
    if (tripId) {
      queryClient.invalidateQueries({ queryKey: participantKeys.list(tripId) });
    } else {
      queryClient.invalidateQueries({ queryKey: participantKeys.all });
    }
  };

  return { invalidateParticipants };
}
