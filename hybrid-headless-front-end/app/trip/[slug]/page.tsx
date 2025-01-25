'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { TripDetails } from '@/components/trips/TripDetails';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useTrip } from '@/lib/hooks/useTrips';
import { useCacheInvalidation } from '@/lib/hooks/useCacheInvalidation';
import { Container } from '@mantine/core';

export default function TripPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data, isLoading, error, refetch } = useTrip(slug);

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
  );}
