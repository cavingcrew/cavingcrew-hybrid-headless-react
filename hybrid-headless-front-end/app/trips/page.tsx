'use client';

import { Container, Title, SimpleGrid } from '@mantine/core';
import { CacheSync } from '@/components/CacheSync';
import { TripCard } from '@/components/trips';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useTrips } from '@/lib/hooks/useTrips';

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

  return (
    <Container size="lg">
      {data?.data && <CacheSync trips={data.data} />}
      <Title order={1} mb="xl">All Available Trips</Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {data.data
          .filter(trip => trip.id !== 1272)
          .map((trip) => (
            <TripCard key={trip.id} trip={trip} />
        ))}
      </SimpleGrid>
    </Container>
  );
}
