'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Container, Title, SimpleGrid } from '@mantine/core';
import { apiService } from '@/lib/api-service';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TripCard } from '@/components/trips/TripCard';
import type { Trip } from '@/types/api';

export default function DynamicPage() {
  const params = useParams();
  const [data, setData] = useState<Trip[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const path = Array.isArray(params.slug) ? params.slug.join('/') : params.slug;
        
        const response = await apiService.getTripsByCategory(path);
        
        if (!response.success) {
          throw new Error('Failed to fetch data');
        }
        
        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.slug]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!data || data.length === 0) {
    return <ErrorState message="No trips found" />;
  }

  return (
    <Container size="lg" py="xl">
      <Title order={1} mb="xl">Trips for {params.slug[0]}</Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {data.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </SimpleGrid>
    </Container>
  );
}
