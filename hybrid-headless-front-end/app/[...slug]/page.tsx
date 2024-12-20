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
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container } from '@mantine/core';
import { apiService } from '@/lib/api-service';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';

export default function CatchAllPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleRoute = async () => {
      const path = Array.isArray(params.slug) ? params.slug.join('/') : params.slug;

      // Check if this is a known route type
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

      // If we get here, it's truly a 404
      setLoading(false);
    };

    handleRoute();
  }, [params.slug, router]);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <Container>
      <ErrorState message="Page not found" />
    </Container>
  );
}
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

      // Check if this is a known route type
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

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!data || data.length === 0) {
    return <ErrorState message="Page not found" />;
  }

  return (
    <Container size="lg" py="xl">
      <Title order={1} mb="xl">Results for {Array.isArray(params.slug) ? params.slug.join('/') : params.slug}</Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {data.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </SimpleGrid>
    </Container>
  );
}
