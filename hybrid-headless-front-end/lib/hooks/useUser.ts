import { useQuery } from '@tanstack/react-query';
import { apiService } from '../api-service';

export const userKeys = {
  all: ['user'] as const,
  status: () => [...userKeys.all, 'status'] as const,
  purchases: () => [...userKeys.all, 'purchases'] as const,
};

export function useUserStatus() {
  const { data: status } = useQuery({
    queryKey: userKeys.status(),
    queryFn: async () => {
      const response = await apiService.getUserStatus();
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    staleTime: 1000 * 30,
  });

  const { data: purchases } = useQuery({
    queryKey: userKeys.purchases(),
    queryFn: async () => {
      const response = await apiService.getUserPurchases();
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    enabled: !!status?.isLoggedIn,
    staleTime: 1000 * 60 * 5,
  });

  return {
    ...status,
    purchasedProducts: purchases?.purchasedProducts || [],
  };
}
