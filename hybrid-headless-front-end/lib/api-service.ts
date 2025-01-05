import type { Trip, Category, ApiResponse } from '../types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 
  (typeof window !== 'undefined' ? window.location.origin + '/wp-json' : 'https://www.cavingcrew.com/wp-json');

export const apiService = {
  async getTrips(page = 1, perPage = 12): Promise<ApiResponse<Trip[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/hybrid-headless/v1/products?page=${page}&per_page=${perPage}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trips');
      }
      const data = await response.json();
      return { data: data.products || [], success: true };
    } catch (error) {
      return { data: [], success: false, message: error instanceof Error ? error.message : 'Failed to fetch trips' };
    }
  },

  async getTrip(slug: string): Promise<ApiResponse<Trip>> {
    try {
      const response = await fetch(`${API_BASE_URL}/hybrid-headless/v1/products/${slug}?by_slug=true`);
      if (!response.ok) {
        throw new Error(`Failed to fetch trip ${slug}`);
      }
      const data = await response.json();
      return { 
        data: data || null, 
        success: true 
      };
    } catch (error) {
      return { 
        data: null, 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch trip' 
      };
    }
  },

  async getCategories(): Promise<ApiResponse<Category[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/hybrid-headless/v1/categories`);
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      return { data: data.categories || [], success: true };
    } catch (error) {
      return { data: [], success: false, message: error instanceof Error ? error.message : 'Failed to fetch categories' };
    }
  },

  async getTripsByCategory(categorySlug: string, page = 1, perPage = 12): Promise<ApiResponse<Trip[]>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/hybrid-headless/v1/products?category=${categorySlug}&page=${page}&per_page=${perPage}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch trips for category ${categorySlug}`);
      }
      const data = await response.json();
      return { data: data.products || [], success: true };
    } catch (error) {
      return { data: [], success: false, message: error instanceof Error ? error.message : 'Failed to fetch category trips' };
    }
  }
};
