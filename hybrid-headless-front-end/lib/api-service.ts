import { API_BASE_URL } from './constants';
import type { Trip, Category, ApiResponse } from '@/types/api';

export const apiService = {
  async getTrips(page = 1, perPage = 12): Promise<ApiResponse<Trip[]>> {
    const response = await fetch(`${API_BASE_URL}/hybrid-headless/v1/products?page=${page}&per_page=${perPage}`);
    if (!response.ok) {
      throw new Error('Failed to fetch trips');
    }
    return response.json();
  },

  async getTrip(slug: string): Promise<ApiResponse<Trip>> {
    const response = await fetch(`${API_BASE_URL}/hybrid-headless/v1/products/${slug}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch trip ${slug}`);
    }
    return response.json();
  },

  async getCategories(): Promise<ApiResponse<Category[]>> {
    const response = await fetch(`${API_BASE_URL}/hybrid-headless/v1/categories`);
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    return response.json();
  },

  async getTripsByCategory(categorySlug: string, page = 1, perPage = 12): Promise<ApiResponse<Trip[]>> {
    const response = await fetch(
      `${API_BASE_URL}/hybrid-headless/v1/products?category=${categorySlug}&page=${page}&per_page=${perPage}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch trips for category ${categorySlug}`);
    }
    return response.json();
  }
};
