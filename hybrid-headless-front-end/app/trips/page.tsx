'use client';

import { Container } from '@mantine/core';
import { useTrips } from '@/lib/hooks/useTrips';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TripsView } from '@/components/trips/TripsView';

export default function TripsPage() {
  const { data, isLoading, error, refetch } = useTrips();

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !data?.success || !data?.data) {
    return <ErrorState 
      message={error?.message || 'Failed to load trips'} 
      onRetry={() => refetch()}
    />;
  }

  const filteredTrips = data.data;

  return (
    <Container size="lg">
      <TripsView trips={filteredTrips} />
    </Container>
  );
}
