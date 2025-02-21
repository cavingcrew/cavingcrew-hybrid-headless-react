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
      console.groupCollapsed('[useUserStatus] Fetching user status');
      const response = await apiService.getUserStatus();
      console.log('User status response:', response);
      console.groupEnd();
      
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    staleTime: 1000 * 30,
  });

  const { data: purchases } = useQuery<ApiResponse<UserPurchasesResponse>>({
    queryKey: userKeys.purchases(),
    queryFn: async () => {
      console.groupCollapsed('[useUserStatus] Fetching user purchases');
      const response = await apiService.getUserPurchases();
      console.log('User purchases response:', response);
      if (response.success) {
        console.log('Purchased product IDs:', response.data.purchased_products);
      }
      console.groupEnd();
      
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

  const result = {
    ...status,
    purchasedProducts: purchases?.data?.purchased_products || [],
  };

  console.groupCollapsed('[useUserStatus] Current user status');
  console.log('Status:', status);
  console.log('Purchases:', purchases?.data);
  console.log('Combined result:', result);
  console.groupEnd();

  return result;
}
