'use client';

import { Container, Title, Text, SimpleGrid, Stack } from '@mantine/core';
import { TripCard } from '@/components/trips/TripCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useEffect, useState } from 'react';
import type { Trip } from '@/types/api';

export default function HomePage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/trips')
      .then(res => res.json())
      .then(data => {
        setTrips(data.trips);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load trips');
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <Container size="lg">
      <Stack spacing="xl">
        <div>
          <Title order={1}>Welcome to Travel Adventures</Title>
          <Text size="lg" mt="md">
            Discover amazing caving experiences with our supportive and friendly community.
          </Text>
        </div>

        <div>
          <Title order={2} mb="md">Featured Trips</Title>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {trips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </SimpleGrid>
        </div>
      </Stack>
    </Container>
  );
}
