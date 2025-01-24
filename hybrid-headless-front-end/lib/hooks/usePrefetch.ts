import { apiService } from '../api-service';

export function usePrefetch() {
  const prefetchAll = async () => {
    try {
      // Prefetch main trips list
      await apiService.getTrips();
      
      // Prefetch categories
      await apiService.getCategories();
    } catch (error) {
      console.error('Prefetch failed:', error);
    }
  };

  return { prefetchAll };
}
