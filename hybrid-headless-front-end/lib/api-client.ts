const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

export async function fetchFromApi<T>(
  endpoint: string,
  options: RequestInit = {},
  cache: RequestCache = 'force-cache'
): Promise<T> {
  const url = `${WP_API_URL}/hybrid-headless/v1${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    cache,
    next: {
      tags: ['wp-content'],
    },
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new APIError(
      response.status,
      `API Error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}
