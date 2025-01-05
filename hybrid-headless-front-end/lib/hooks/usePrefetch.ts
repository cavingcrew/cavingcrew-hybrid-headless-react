import { useQueryClient } from '@tanstack/react-query';
import { apiService } from '../api-service';

export function usePrefetch() {
  const queryClient = useQueryClient();

  const prefetchAll = async () => {
    // Prefetch all trips
    await queryClient.prefetchQuery({
      queryKey: ['trips'],
      queryFn: () => apiService.getTrips()
    });

    // Prefetch categories
    await queryClient.prefetchQuery({
      queryKey: ['categories'],
      queryFn: () => apiService.getCategories()
    });
  };

  return { prefetchAll };
}
