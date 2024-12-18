import { fetchFromApi } from './api-client';
import type { Trip, Category, ApiResponse } from '@/types/api';

export const apiService = {
  async getTrips(page = 1, perPage = 12) {
    return fetchFromApi<ApiResponse<Trip[]>>(
      `/trips?page=${page}&per_page=${perPage}`
    );
  },

  async getTrip(slug: string) {
    return fetchFromApi<ApiResponse<Trip>>(
      `/trips/${slug}`
    );
  },

  async getCategories() {
    return fetchFromApi<ApiResponse<Category[]>>(
      '/categories'
    );
  },

  async getTripsByCategory(categorySlug: string, page = 1, perPage = 12) {
    return fetchFromApi<ApiResponse<Trip[]>>(
      `/categories/${categorySlug}/trips?page=${page}&per_page=${perPage}`
    );
  }
};
