'use client';

import { SimpleGrid } from '@mantine/core';
import dynamic from 'next/dynamic';
import type { Trip } from '@/types/api';

const TripCard = dynamic(() => import('@/components/trips/TripCard'), {
  ssr: false,
  loading: () => <p>Loading...</p>
});

interface CategoryTripsGridProps {
  trips: Trip[];
}

export function CategoryTripsGrid({ trips }: CategoryTripsGridProps) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </SimpleGrid>
  );
}
