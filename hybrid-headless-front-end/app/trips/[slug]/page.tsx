'use client';

import { Container } from '@mantine/core';
import { useTrip } from '@/lib/hooks/useTrips';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TripDetails } from '@/components/trips/TripDetails';
import React from 'react';

interface TripPageProps {
  params: { slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function TripPage({ params }: TripPageProps) {
  // Properly unwrap the params Promise
  const resolvedParams = React.use(params);
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
