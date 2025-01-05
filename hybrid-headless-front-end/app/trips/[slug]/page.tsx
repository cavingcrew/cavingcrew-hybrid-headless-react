'use client';

import { Container } from '@mantine/core';
import { useTrip } from '@/lib/hooks/useTrips';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TripDetails } from '@/components/trips/TripDetails';
import { use } from 'react';

interface TripPageProps {
  params: Promise<{ slug: string }>;
}

export default function TripPage({ params }: TripPageProps) {
  const resolvedParams = use(params);
  const { data, isLoading, error, refetch } = useTrip(resolvedParams.slug);

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
