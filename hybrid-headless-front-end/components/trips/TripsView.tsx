'use client';

import { useState, useMemo } from 'react';
import { 
  Stack, Title, Text, SimpleGrid, 
  SegmentedControl, Select, Group, Badge,
  useMantineTheme
} from '@mantine/core';
import { 
  IconCategory, 
  IconCalendar,
  IconStairs,
  IconArrowBarUp,
  IconSparkles,
  IconChecklist,
  IconList 
} from "@tabler/icons-react";
import TripCard from './TripCard';
import type { Trip } from '@/types/api';

interface TripsViewProps {
  trips: Trip[];
}

export function TripsView({ trips }: TripsViewProps) {
  const [sortMode, setSortMode] = useState<'category' | 'date'>('category');
  const [filterMode, setFilterMode] = useState<
    'all' | 'horizontal' | 'vertical' | 'extra-welcoming' | 'available'
  >('all');

  const filteredTrips = useMemo(() => {
    const now = new Date();
    return trips.filter(trip => {
      // Common date sorting fallback for trips without dates
      const tripDate = trip.acf.event_start_date_time 
        ? new Date(trip.acf.event_start_date_time)
        : new Date(0); // Default to epoch if no date

      // Filter logic
      const isAvailable = trip.stock_status === 'instock' && 
        (trip.stock_quantity ?? 1) > 0;
      const isExtraWelcoming = trip.categories.some(
        cat => cat.slug === 'extra-welcoming-trips'
      );
      const isVertical = trip.acf.event_type === 'overnight' || 
        trip.acf.event_gear_required?.toLowerCase().includes('srt');

      return (
        (filterMode === 'all' ||
        (filterMode === 'horizontal' && !isVertical) ||
        (filterMode === 'vertical' && isVertical) ||
        (filterMode === 'extra-welcoming' && isExtraWelcoming) ||
        (filterMode === 'available' && isAvailable)) &&
        tripDate > now // Only show future trips
      );
    });
  }, [trips, filterMode]);

  const sortedTrips = useMemo(() => {
    return [...filteredTrips].sort((a, b) => {
      const dateA = a.acf.event_start_date_time ? 
        new Date(a.acf.event_start_date_time).getTime() : 0;
      const dateB = b.acf.event_start_date_time ? 
        new Date(b.acf.event_start_date_time).getTime() : 0;
      return dateA - dateB; // Closest first
    });
  }, [filteredTrips]);

  // Category grouping logic
  const categoryMap = useMemo(() => {
    const map = new Map<string, { 
      name: string; 
      description: string; 
      trips: Trip[] 
    }>();

    sortedTrips.forEach(trip => {
      const category = trip.categories[0];
      if (category) {
        if (!map.has(category.slug)) {
          map.set(category.slug, {
            name: category.name,
            description: category.description,
            trips: []
          });
        }
        map.get(category.slug)?.trips.push(trip);
      }
    });

    return map;
  }, [sortedTrips]);

  const orderedCategories = useMemo(() => {
    return Array.from(categoryMap.entries()).sort(([slugA], [slugB]) => {
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
  }, [categoryMap]);

  return (
    <Stack gap="xl">
      {/* Header Section */}
      <Stack gap="md">
        <Title order={1}>We're the Caving Crew!</Title>
        <Text size="xl">
          A bunch of supportive, friendly people who like to encourage each other to cave and eat cake.
        </Text>
      </Stack>

      {/* Controls Section */}
      <Stack gap="md">
        {/* Sort Controls */}
        <SegmentedControl
          value={sortMode}
          onChange={(value) => setSortMode(value as 'category' | 'date')}
          data={[
            {
              value: 'category',
              label: (
                <Group gap="xs" justify="center" wrap="nowrap">
                  <IconCategory size={18} />
                  <Text size="sm">Category</Text>
                </Group>
              ),
            },
            {
              value: 'date',
              label: (
                <Group gap="xs" justify="center" wrap="nowrap">
                  <IconCalendar size={18} />
                  <Text size="sm">Date</Text>
                </Group>
              ),
            },
          ]}
          fullWidth
          styles={{
            root: {
              flex: 1,
              minWidth: '100%',
              [theme.fn.largerThan('sm')]: {
                minWidth: '300px',
              },
            },
          }}
        />

        {/* Filter Controls */}
        <SegmentedControl
          value={filterMode}
          onChange={(value) => setFilterMode(value as any)}
          data={[
            {
              value: 'all',
              label: (
                <Group gap="xs" justify="center" wrap="nowrap">
                  <IconList size={18} />
                  <Text size="sm">All</Text>
                </Group>
              ),
            },
            {
              value: 'horizontal',
              label: (
                <Group gap="xs" justify="center" wrap="nowrap">
                  <IconStairs size={18} />
                  <Text size="sm">Horizontal</Text>
                </Group>
              ),
            },
            {
              value: 'vertical',
              label: (
                <Group gap="xs" justify="center" wrap="nowrap">
                  <IconArrowBarUp size={18} />
                  <Text size="sm">Vertical</Text>
                </Group>
              ),
            },
            {
              value: 'extra-welcoming',
              label: (
                <Group gap="xs" justify="center" wrap="nowrap">
                  <IconSparkles size={18} />
                  <Text size="sm">Welcoming</Text>
                </Group>
              ),
            },
            {
              value: 'available',
              label: (
                <Group gap="xs" justify="center" wrap="nowrap">
                  <IconChecklist size={18} />
                  <Text size="sm">Available</Text>
                </Group>
              ),
            },
          ]}
          color="blue"
          fullWidth
          styles={{
            root: {
              flex: 1,
              minWidth: '100%',
              [theme.fn.largerThan('sm')]: {
                minWidth: '300px',
              },
            },
            label: {
              padding: '4px 8px',
            },
          }}
        />
      </Stack>

      {/* Content Section */}
      {sortMode === 'category' ? (
        orderedCategories.map(([slug, category]) => (
          <Stack key={slug} gap="md">
            <Group justify="space-between">
              <Title order={2}>{category.name}</Title>
              <Badge variant="outline" color="gray">
                {category.trips.length} upcoming
              </Badge>
            </Group>
            
            {category.description && (
              <Text dangerouslySetInnerHTML={{ __html: category.description }} />
            )}

            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
              {category.trips.map(trip => (
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
