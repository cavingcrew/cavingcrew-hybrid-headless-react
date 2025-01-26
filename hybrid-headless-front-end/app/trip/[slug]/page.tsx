'use client';

export const dynamic = 'force-static'
export const revalidate = false
export const fetchCache = 'only-cache'

import { useParams } from 'next/navigation';
import { TripDetails } from '@/components/trips/TripDetails';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useTrip } from '@/lib/hooks/useTrips';
import { Container } from '@mantine/core';

export default function TripPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const { data, isLoading, error, refetch } = useTrip(slug || '');

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

  return (
    <Container size="lg" py="xl">
      <TripDetails trip={data.data} />
    </Container>
  );
}
