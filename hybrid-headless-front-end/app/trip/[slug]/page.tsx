'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { TripDetails } from '@/components/trips/TripDetails';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useTrip } from '@/lib/hooks/useTrips';
import { useCacheInvalidation } from '@/lib/hooks/useCacheInvalidation';
import { Container, Group, Badge } from '@mantine/core';

export default function TripPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data, isLoading, isFetching, error, refetch } = useTrip(slug);

  // Show cached data immediately if available
  const showLoading = isLoading && !data?.data;
  const showStaleData = data?.data && isFetching;

  if (showLoading) {
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
      <Group justify="space-between" align="center" mb="xl">
        <Title order={1}>{data.data.name}</Title>
        {showStaleData && (
          <Badge color="yellow" variant="light">
            Updating trip details...
          </Badge>
        )}
      </Group>
      <TripDetails trip={data.data} />
    </Container>
  );
}
