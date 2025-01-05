'use client';

import { Container, Title, SimpleGrid } from '@mantine/core';
import TripCard from '../components/trips/TripCard';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { useTrips } from '@/lib/hooks/useTrips';

export default function HomePage() {
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
      <Title order={1} mb="xl">Featured Trips</Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {data.data.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </SimpleGrid>
    </Container>
  );
}
