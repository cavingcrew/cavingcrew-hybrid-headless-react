export interface Trip {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: {
    url: string;
    alt: string;
  };
  price: number;
  duration: number;
  stockStatus: 'instock' | 'outofstock';
  stockQuantity?: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
}

export interface ApiResponse<T> {
  data: T | null;
  success: boolean;
  message?: string;
}
