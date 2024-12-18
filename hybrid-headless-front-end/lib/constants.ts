export const API_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_WORDPRESS_API_URL environment variable is not defined');
}
