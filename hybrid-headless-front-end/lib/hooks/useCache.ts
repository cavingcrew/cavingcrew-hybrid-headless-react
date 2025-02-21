import { useQueryClient } from '@tanstack/react-query';
import { tripKeys } from './useTrips';
import type { ApiResponse, Trip } from '../../types/api';
import { apiService } from '../api-service';

export function useTripCache() {
  const queryClient = useQueryClient();

  const prefetchTrip = (slug: string) => {
    queryClient.prefetchQuery({
      queryKey: tripKeys.detail(slug),
      queryFn: async () => {
        const trips = queryClient.getQueryData<ApiResponse<Trip[]>>(tripKeys.all);
        return trips?.data?.find(t => t.slug === slug) || apiService.getTrip(slug);
      }
    });
  };

  return { prefetchTrip };
}
