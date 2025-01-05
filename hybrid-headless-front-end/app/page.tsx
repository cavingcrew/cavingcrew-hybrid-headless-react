'use client';

import { Container, Title, SimpleGrid } from '@mantine/core';
import { useEffect, useState } from 'react';
import TripCard from '@/components/trips/TripCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import type { Trip } from '@/types/api';

export default function HomePage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrips() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/hybrid-headless/v1/products`);
        if (!response.ok) throw new Error('Failed to fetch trips');
        const data = await response.json();
        setTrips(data.products.map((trip: any) => ({
          id: trip.id,
          name: trip.name,
          slug: trip.slug,
          short_description: trip.short_description,
          price: trip.price,
          stock_status: trip.stock_status,
          images: trip.images,
          categories: trip.categories
        })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load trips');
      } finally {
        setLoading(false);
      }
    }

    fetchTrips();
  }, []);

  if (loading) {
    return <LoadingState />;
  }
  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <Container size="lg">
      <Title order={1} mb="xl">Featured Trips</Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </SimpleGrid>
    </Container>
  );
}
