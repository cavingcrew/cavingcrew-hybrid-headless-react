'use client';

import { useState } from 'react';
import { Group, SegmentedControl, Stack, Title, Text, SimpleGrid } from '@mantine/core';
import TripCard from './TripCard';
import type { Trip } from '@/types/api';

interface TripsViewProps {
  trips: Trip[];
}

export function TripsView({ trips }: TripsViewProps) {
  const [sortMode, setSortMode] = useState<'category' | 'date'>('category');
  const [filterMode, setFilterMode] = useState<'all' | 'beginner'>('all');

  const getTripDate = (trip: Trip) => {
    const dateString = trip.acf.event_start_date_time;
    return dateString ? new Date(dateString) : new Date(0);
  };

  const filteredTrips = trips.filter(trip => {
    if (filterMode === 'beginner') {
      return trip.categories.some(cat => cat.slug === 'giggletrips');
    }
    return true;
  });

  const sortedTrips = [...filteredTrips].sort((a, b) => {
    if (sortMode === 'date') {
      return getTripDate(a).getTime() - getTripDate(b).getTime();
    }
    return 0;
  });

  const tripsByCategory = sortedTrips.reduce((acc, trip) => {
    const category = trip.categories[0]?.name || 'Other Trips';
    if (!acc[category]) acc[category] = [];
    acc[category].push(trip);
    return acc;
  }, {} as Record<string, Trip[]>);

  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <Title order={1}>All Available Trips</Title>
        
        <Group>
          <SegmentedControl
            value={sortMode}
            onChange={(value) => setSortMode(value as 'category' | 'date')}
            data={[
              { label: 'Group by Category', value: 'category' },
              { label: 'Sort by Date', value: 'date' },
            ]}
          />

          <SegmentedControl
            value={filterMode}
            onChange={(value) => setFilterMode(value as 'all' | 'beginner')}
            data={[
              { label: 'All Trips', value: 'all' },
              { label: 'Beginner Trips', value: 'beginner' },
            ]}
          />
        </Group>
      </Group>

      {sortMode === 'category' ? (
        Object.entries(tripsByCategory).map(([category, categoryTrips]) => (
          <Stack key={category} gap="sm">
            <Title order={2}>{category}</Title>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
              {categoryTrips.map(trip => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </SimpleGrid>
          </Stack>
        ))
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {sortedTrips.map(trip => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
