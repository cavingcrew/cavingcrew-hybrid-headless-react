'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { TripDetails } from '@/components/trips/TripDetails';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useTrip } from '@/lib/hooks/useTrips';
import { Container, Group, Badge, Title } from '@mantine/core';

export default function TripPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data, isLoading, isFetching, error, refetch } = useTrip(slug);

  // Add proper type assertion for the data object
  const tripData = data?.data;
  
  // Update loading checks with proper typing
  const showLoading = isLoading && !tripData;
  const showStaleData = !!tripData && isFetching;

  if (showLoading) {
    return <LoadingState />;
  }

  if (error || !data?.success || !tripData) {
    return (
      <ErrorState
        message={error?.message || 'Failed to load trip'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" align="center" mb="xl">
        <Title order={1}>{tripData.name}</Title>
        {showStaleData && (
          <Badge color="yellow" variant="light">
            Updating trip details...
          </Badge>
        )}
      </Group>
      <TripDetails trip={tripData} />
    </Container>
  );
}
