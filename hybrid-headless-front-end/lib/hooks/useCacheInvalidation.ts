'use client';


import { useQueryClient } from '@tanstack/react-query';
import { tripKeys } from './useTrips';

export function useCacheInvalidation() {
  const queryClient = useQueryClient();

  const invalidateTrips = () => {
    queryClient.invalidateQueries({ queryKey: tripKeys.all });
    queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
  };

  return { invalidateTrips };
}
