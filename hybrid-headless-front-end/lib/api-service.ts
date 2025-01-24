import type { 
  Trip, 
  Category, 
  ApiResponse, 
  ProductStockResponse 
} from '../types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 
  (typeof window !== 'undefined' ? window.location.origin + '/wp-json' : 'https://www.cavingcrew.com/wp-json');

export const apiService = {
  async getUserStatus(): Promise<ApiResponse<{
    isLoggedIn: boolean;
    isMember: boolean;
    cartCount: number;
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/hybrid-headless/v1/user-status`, {
        credentials: 'include'
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

  async addToCart(productId: number, variationId: number): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/hybrid-headless/v1/cart`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          variation_id: variationId,
          quantity: 1
        })
      });
      
      if (!response.ok) throw new Error('Failed to add to cart');
      const data = await response.json();
      return { data, success: true };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to add to cart'
      };
    }
  },

  async getTrips(page = 1, perPage = 12): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/hybrid-headless/v1/products`);
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
  }
};
