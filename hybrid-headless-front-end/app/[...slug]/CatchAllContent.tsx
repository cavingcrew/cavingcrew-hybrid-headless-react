'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Container, Title } from '@mantine/core';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { CategoryTripsGrid } from '../../components/categories/CategoryTripsGrid';
import { TripDetails } from '../../components/trips/TripDetails';
import { useTrip, useCategoryTrips } from '@/lib/hooks/useTrips';

export function CatchAllContent() {
  const params = useParams();
  const [path, setPath] = useState<string[]>([]);

  useEffect(() => {
    // Filter out any undefined values and ensure we have strings
    const segments = Array.isArray(params.slug) 
      ? params.slug.filter((segment): segment is string => segment !== undefined)
      : params.slug 
        ? [params.slug].filter((segment): segment is string => segment !== undefined)
        : [];
    
    setPath(segments);
  }, [params.slug]);

  // Handle trip pages
  if (path[0] === 'trip' && path[1]) {
    const { data, isLoading, error, refetch } = useTrip(path[1]);

    if (isLoading) return <LoadingState />;

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
    );
  }

  // Handle category pages
  if (path[0] === 'category' && path[1]) {
    const { data, isLoading, error, refetch } = useCategoryTrips(path[1]);

    if (isLoading) return <LoadingState />;

    if (error || !data?.success || !data?.data) {
      return (
        <ErrorState
          message={error?.message || 'Failed to load category'}
          onRetry={() => refetch()}
        />
      );
    }

    return (
      <Container size="lg" py="xl">
        <Title order={1} mb="xl">Category: {path[1].replace(/-/g, ' ')}</Title>
        <CategoryTripsGrid trips={data.data.products} />
      </Container>
    );
  }

  // Default to error state for unknown routes
  return <ErrorState message="Page not found" />;
}
