import { useState, useEffect } from 'react';
import { fetchFromApi } from '@/lib/api-client';

interface StockInfo {
  stockStatus: 'instock' | 'outofstock';
  stockQuantity?: number;
}

export function useStockMonitor(productId: number) {
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkStock = async () => {
      try {
        const response = await fetchFromApi<StockInfo>(
          `/products/${productId}`,
          {},
          'no-store' // Don't cache stock checks
        );
        setStockInfo(response);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to check stock'));
      } finally {
        setLoading(false);
      }
    };

    // Initial check
    checkStock();

    // Poll every 30 seconds
    const interval = setInterval(checkStock, 30000);

    return () => clearInterval(interval);
  }, [productId]);

  return { stockInfo, loading, error };
}
