'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Container, Title } from '@mantine/core';
import { apiService } from '@/lib/api-service';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { CategoryTripsGrid } from '@/components/categories/CategoryTripsGrid';
import { TripDetails } from '@/components/trips/TripDetails';
import type { Trip } from '@/types/api';

export function CatchAllContent() {
  const params = useParams();
  const [data, setData] = useState<Trip[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleRoute = async () => {
      if (!params.slug) {
        setError('Invalid path');
        setLoading(false);
        return;
      }

      const segments = Array.isArray(params.slug) ? params.slug : [params.slug];
      
      try {
        // Handle trip routes
        if (segments[0] === 'trip' && segments[1]) {
          const response = await apiService.getTrip(segments[1]);
          if (!response.success || !response.data) {
            throw new Error('Trip not found');
          }
          
          // Use the data directly
          setData([response.data]);
        }
        // Handle category routes
        else if (segments[0] === 'category' && segments[1]) {
          const response = await apiService.getTripsByCategory(segments[1]);
          if (!response.success) {
            throw new Error('Category not found');
          }
          setData(response.data);
        }
        // Any other pattern shows 404
        else {
          setError('Page not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    handleRoute();
  }, [params.slug]);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !data || data.length === 0) {
    return <ErrorState message={error || 'Page not found'} />;
  }

  const segments = Array.isArray(params.slug) ? params.slug : [params.slug];
  const isTrip = segments[0] === 'trip';
  const title = isTrip ? data[0].name : `Category: ${segments[1]}`;

  return (
    <Container size="lg" py="xl">
      {isTrip ? (
        <TripDetails trip={data[0]} />
      ) : (
        <>
          <Title order={1} mb="xl">{title}</Title>
          <CategoryTripsGrid trips={data} />
        </>
      )}
    </Container>
  );
}
