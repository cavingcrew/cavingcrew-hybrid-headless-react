'use client';

import { Auth } from '../../utils/user-utils';
import type { Trip, AccessLevel } from '../../types/api';

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
      
      // Don't throw error, just log it in development
      if (!response.success) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('User authentication failed:', response.message);
          console.info('Note: XSS protection may prevent login in some environments');
        }
      }
      
      return response;
    },
    staleTime: 1000 * 600,
    refetchOnWindowFocus: false,
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

  const user = data?.data ?? null; // Convert undefined to null

  return {
    user,
    isLoggedIn: Auth.isLoggedIn(user),
    isMember: Auth.isMember(user),
    isCommittee: Auth.isCommittee(user),
    isAdmin: (accessLevel?: AccessLevel | string) => Auth.isAdmin(user, accessLevel),
    isTripLeader: (trip?: Trip) => Auth.isTripLeader(user, trip),
    hasPurchased: (tripId: number) => 
      tripId ? user?.purchases?.includes(tripId) ?? false : false,
    purchasedProducts: user?.purchases || [],
    cartCount: user?.cartCount || 0,
    isLoading,
    error
  };
}
