export const userKeys = {
  all: ['user'] as const,
  status: () => [...userKeys.all, 'status'] as const,
  purchases: () => [...userKeys.all, 'purchases'] as const,
};

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../api-service';
import type { ApiResponse, UserPurchasesResponse } from '../../types/api';

export function useUserStatus() {
  const queryClient = useQueryClient();

  const { data: status } = useQuery({
    queryKey: userKeys.status(),
    queryFn: async () => {
      const response = await apiService.getUserStatus();
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    staleTime: 1000 * 30,
  });

  const { data: purchases } = useQuery<ApiResponse<UserPurchasesResponse>>({
    queryKey: userKeys.purchases(),
    queryFn: async () => {
      const response = await apiService.getUserPurchases();
      if (!response.success) throw new Error(response.message);
      return response;
    },
    enabled: !!status?.isLoggedIn,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (status?.isLoggedIn) {
      queryClient.prefetchQuery({
        queryKey: userKeys.purchases(),
        queryFn: async () => {
          const response = await apiService.getUserPurchases();
          if (!response.success) throw new Error(response.message);
          return response;
        },
      });
    }
  }, [status?.isLoggedIn, queryClient]);

  return {
    ...status,
    purchasedProducts: purchases?.data?.purchased_products || [],
  };
}
