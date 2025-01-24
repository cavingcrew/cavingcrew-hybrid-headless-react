'use client';

import { useRouter } from 'next/navigation';
import { TripDetails } from '@/components/trips/TripDetails';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useTrip } from '@/lib/hooks/useTrips';
import { useCacheInvalidation } from '@/lib/hooks/useCacheInvalidation';

export default function TripPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const { data, isLoading, error, refetch } = useTrip(slug);
  const router = useRouter();
  const { invalidateTrips } = useCacheInvalidation();

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !data?.success || !data?.data) {
    return (
      <ErrorState
        message={error?.message || 'Failed to load trip'}
        onRetry={() => refetch()}
      />
    );
  }

  return <TripDetails trip={data.data} />;
}
