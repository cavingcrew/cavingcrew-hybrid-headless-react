'use client';


const DEFAULT_API_URL = 'https://www.cavingcrew.com/wp-json';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_API_URL ||
  (typeof window !== 'undefined' ? window.location.origin + '/wp-json' : DEFAULT_API_URL);

if (!API_BASE_URL && process.env.NODE_ENV === 'production') {
  console.error('NEXT_PUBLIC_WORDPRESS_API_URL is required in production');
}
