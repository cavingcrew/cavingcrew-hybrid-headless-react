export const userKeys = {
  all: ['user'] as const,
  user: () => [...userKeys.all, 'data'] as const,
};

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../api-service';
import type { ApiResponse, UserResponse } from '../../types/api';

export function useUser() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<ApiResponse<UserResponse>>({
    queryKey: userKeys.user(),
    queryFn: async () => {
      console.groupCollapsed('[useUser] Fetching user data');
      const response = await apiService.getUser();
      console.log('User response:', response);
      console.groupEnd();
      if (!response.success) throw new Error(response.message);
      return response;
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (data?.data?.isLoggedIn) {
      queryClient.prefetchQuery({
        queryKey: userKeys.user(),
        queryFn: async () => {
          const response = await apiService.getUser();
          if (!response.success) throw new Error(response.message);
          return response;
        },
      });
    }
  }, [data?.data?.isLoggedIn, queryClient]);

  return {
    isLoggedIn: data?.data?.isLoggedIn || false,
    isMember: data?.data?.isMember || false,
    purchasedProducts: data?.data?.purchases || [],
    user: data?.data?.user,
    cartCount: data?.data?.cartCount || 0,
    isLoading,
    error
  };
}
