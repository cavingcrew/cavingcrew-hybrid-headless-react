'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Title, SimpleGrid } from '@mantine/core';
import { apiService } from '@/lib/api-service';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TripCard } from '@/components/trips/TripCard';
import type { Trip } from '@/types/api';

export default function CatchAllPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<Trip[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleRoute = async () => {
      const path = Array.isArray(params.slug) ? params.slug.join('/') : params.slug;

      // Handle known route patterns first
      if (path.startsWith('trips/')) {
        router.push(`/trips/${path.replace('trips/', '')}`);
        return;
      }
      if (path.startsWith('categories/')) {
        router.push(`/categories/${path.replace('categories/', '')}`);
        return;
      }
      if (path === 'trips' || path === 'categories') {
        router.push(`/${path}`);
        return;
      }

      // If not a redirect, try to fetch data
      try {
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

    handleRoute();
  }, [params.slug, router]);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !data || data.length === 0) {
    return <ErrorState message="Page not found" />;
  }

  return (
    <Container size="lg" py="xl">
      <Title order={1} mb="xl">
        Results for {Array.isArray(params.slug) ? params.slug.join('/') : params.slug}
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {data.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </SimpleGrid>
    </Container>
  );
}
