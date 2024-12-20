interface AddToCartOptions {
  productId: number;
  quantity?: number;
  redirectToCart?: boolean;
}

export const cartService = {
  async addToCart({ productId, quantity = 1, redirectToCart = true }: AddToCartOptions) {
    // Get WordPress cart URL from environment variable
    const wpBaseUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL;
    
    // Construct the add-to-cart URL
    const cartUrl = new URL(`${wpBaseUrl}/cart/`);
    const params = new URLSearchParams({
      'add-to-cart': productId.toString(),
      'quantity': quantity.toString(),
    });

    if (redirectToCart) {
      // Redirect to WordPress cart page with parameters
      window.location.href = `${cartUrl}?${params.toString()}`;
    } else {
      // Just add to cart without redirect (for future use)
      try {
        const response = await fetch(`${cartUrl}?${params.toString()}`, {
          method: 'GET',
          credentials: 'include', // Important for maintaining session
        });
        return response.ok;
      } catch (error) {
        console.error('Failed to add to cart:', error);
        return false;
      }
    }
  }
};
