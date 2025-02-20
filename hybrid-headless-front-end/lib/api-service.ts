import { API_BASE_URL } from './constants';
import type { 
  Trip, 
  Category, 
  ApiResponse, 
  ProductStockResponse,
  UserStatusResponse,
  UserPurchasesResponse
} from '../types/api';

export const apiService = {
  async getUserStatus(): Promise<ApiResponse<UserStatusResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}/hybrid-headless/v1/user-status`, {
        credentials: 'include', // Required for cookies
        headers: {
          'Cache-Control': 'no-store' // Prevent caching of auth state
        }
      });
      if (!response.ok) throw new Error('Failed to fetch user status');
      const data = await response.json();
      return { data, success: true };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to fetch user status'
      };
    }
  },
  async getProductStock(productId: number): Promise<ApiResponse<ProductStockResponse>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/hybrid-headless/v1/products/${productId}/stock`
      );
      if (!response.ok) throw new Error('Failed to fetch stock');
      const data = await response.json();
      return { data, success: true };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to fetch stock'
      };
    }
  },
  async getProductVariations(productId: number): Promise<ApiResponse<{
    variations: any[];
    userStatus: { isLoggedIn: boolean; isMember: boolean };
  }>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/hybrid-headless/v1/products/${productId}/variations`
      );
      if (!response.ok) throw new Error('Failed to fetch variations');
      const data = await response.json();
      return { data, success: true };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to fetch variations'
      };
    }
  },

  async getStock(productId: number, variationId: number): Promise<ApiResponse<{
    stock_quantity: number;
    stock_status: string;
  }>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/hybrid-headless/v1/stock/${productId}/${variationId}`
      );
      if (!response.ok) throw new Error('Failed to fetch stock');
      const data = await response.json();
      return { data, success: true };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to fetch stock'
      };
    }
  },


  async getTrips(page = 1, perPage = 30): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/hybrid-headless/v1/products?page=${page}&per_page=${perPage}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch trips');
      }
      const data = await response.json();
      return { 
        success: true,
        data 
      };
    } catch (error) {
      return { 
        success: false, 
        data: null,
        message: error instanceof Error ? error.message : 'Failed to fetch trips' 
      };
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
  },

  async getUserPurchases(): Promise<ApiResponse<UserPurchasesResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}/hybrid-headless/v1/user-purchases`, {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-store' }
      });
      if (!response.ok) throw new Error('Failed to fetch user purchases');
      const data = await response.json();
      return { data, success: true };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to fetch user purchases'
      };
    }
  }
};
