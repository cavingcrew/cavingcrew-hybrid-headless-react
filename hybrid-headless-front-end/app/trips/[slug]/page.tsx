'use client';

import { use } from 'react';
import { Container } from '@mantine/core';
import { useTrip } from '@/lib/hooks/useTrips';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TripDetails } from '@/components/trips/TripDetails';

interface TripPageProps {
  params: Promise<{ slug: string }>;
}

export default function TripPage({ params }: TripPageProps) {
  const { slug } = use(params);
  const { data, isLoading, error, refetch } = useTrip(slug);
  const router = useRouter();
  const { invalidateTrips } = useCacheInvalidation();

  // Add automatic retry
  useEffect(() => {
    if (error && !isLoading) {
      const retryTimer = setTimeout(() => refetch(), 5000);
      return () => clearTimeout(retryTimer);
    }
  }, [error, isLoading, refetch]);

  // Add cache invalidation on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        invalidateTrips();
      }
    };
    
    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [invalidateTrips]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !data?.success || !data?.data) {
    return <ErrorState 
      message={error?.message || 'Failed to load trip'} 
      onRetry={() => refetch()}
    />;
  }

  return (
    <Container size="lg" py="xl">
      <TripDetails trip={data.data} />
    </Container>
  );
}
