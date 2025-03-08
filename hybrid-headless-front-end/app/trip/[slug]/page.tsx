'use client';

import React, { use } from 'react';
import { TripDetails } from '@/components/trips/TripDetails';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useTrip, useTrips } from '@/lib/hooks/useTrips';
import { Container, Group, Badge, Title } from '@mantine/core';

export default function TripPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: tripsData } = useTrips();
  const { data, isLoading, isFetching, error, refetch } = useTrip(slug);

  const trip = data?.data || tripsData?.data?.find(t => t.slug === slug);
  const showStaleData = !!trip && isFetching;

  if (isLoading && !trip) {
    return <LoadingState />;
  }

  if (error || !data?.success || !trip) {
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
        <Title order={1}>{trip.name}</Title>
        {showStaleData && (
          <Badge color="yellow" variant="light">
            Updating trip details...
          </Badge>
        )}
      </Group>
      <TripDetails trip={trip} />
    </Container>
  );
}
