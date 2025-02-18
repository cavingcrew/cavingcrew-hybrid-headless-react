'use client';

import { useState } from 'react';
import { Stack, Title, Text, SimpleGrid } from '@mantine/core';
import TripCard from './TripCard';
import type { Trip } from '@/types/api';

interface TripsViewProps {
  trips: Trip[];
}

export function TripsView({ trips }: TripsViewProps) {
  const [sortMode, setSortMode] = useState<'category' | 'date'>('category');
  const [filterMode, setFilterMode] = useState<'all' | 'beginner'>('all');

  // Get unique categories preserving order from first occurrence
  const categoryMap = trips.reduce((acc, trip) => {
    const category = trip.categories[0];
    if (category) {
      if (!acc.has(category.slug)) {
        acc.set(category.slug, {
          name: category.name,
          description: category.description,
          trips: []
        });
      }
      acc.get(category.slug)?.trips.push(trip);
    }
    return acc;
  }, new Map<string, { name: string; description: string; trips: Trip[] }>());

  // Convert map to array and sort by predefined category order
  const orderedCategories = Array.from(categoryMap.entries())
    .sort(([slugA], [slugB]) => {
      const order = [
        'extra-welcoming-trips',
        'evening-day-caving',
        'overnight-trips',
        'training-trips',
        'memberships',
        'social-events'
      ];
      return order.indexOf(slugA) - order.indexOf(slugB);
    });

  return (
    <Stack gap="xl">
      {/* Header Section */}
      <Stack gap="md">
        <Title order={1}>We're the Caving Crew!</Title>
        <Text size="xl">
          A bunch of supportive, friendly people who like to encourage each other to cave and eat cake.
        </Text>
      </Stack>

      {/* Category Sections */}
      {orderedCategories.map(([slug, category]) => (
        <Stack key={slug} gap="md">
          <Title order={2}>{category.name}</Title>
          
          {category.description && (
            <Text dangerouslySetInnerHTML={{ __html: category.description }} />
          )}

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {category.trips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </SimpleGrid>
        </Stack>
      ))}
    </Stack>
  );
}
