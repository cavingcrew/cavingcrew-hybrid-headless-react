'use client';

import { Container } from '@mantine/core';
import { useTrip } from '@/lib/hooks/useTrips';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TripDetails } from '@/components/trips/TripDetails';
import { useParams } from 'next/navigation';

export default function TripPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const { data, isLoading, error, refetch } = useTrip(slug);

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
