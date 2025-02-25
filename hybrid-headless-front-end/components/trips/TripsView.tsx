'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Stack, Title, Text, SimpleGrid,
  SegmentedControl, Select, Group, Badge,
  useMantineTheme, Button, Table, ThemeIcon, Anchor
} from '@mantine/core';
import { WelcomeMessage } from '@/components/WelcomeMessage/WelcomeMessage';
import {
  IconCategory,
  IconCalendar,
  IconStairs,
  IconArrowBarUp,
  IconSparkles,
  IconChecklist,
  IconList,
  IconBabyCarriage,
  IconLayoutGrid,
  IconCalendarEvent,
  IconSchool
} from "@tabler/icons-react";
import Link from "next/link";
import TripCard from './TripCard';
import type { Trip } from '@/types/api';

interface TripsViewProps {
  trips: Trip[];
}

export function TripsView({ trips }: TripsViewProps) {
  const theme = useMantineTheme();
  const router = useRouter();
  const [sortMode, setSortMode] = useState<'category' | 'date' | 'schedule'>('category');
  const [filterMode, setFilterMode] = useState<
    'all' | 'horizontal' | 'vertical' | 'extra-welcoming' | 'available' | 'u18s'
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
      const isU18Friendly = trip.acf.event_u18s_come === 'yes';

      return (
        (filterMode === 'all' ||
        (filterMode === 'horizontal' && !isVertical) ||
        (filterMode === 'vertical' && isVertical) ||
        (filterMode === 'extra-welcoming' && isExtraWelcoming) ||
        (filterMode === 'available' && isAvailable) ||
        (filterMode === 'u18s' && isU18Friendly)) &&
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
      <WelcomeMessage />

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
            {
              value: 'schedule',
              label: (
                <Group gap="xs" justify="center" wrap="nowrap">
                  <IconLayoutGrid size={18} />
                  <Text size="sm">Schedule</Text>
                </Group>
              ),
            },
          ]}
          fullWidth
          styles={{
            root: {
              flex: 1,
              minWidth: '100%',
              [`@media (min-width: ${theme.breakpoints.sm})`]: {
                minWidth: '300px',
              },
            },
          }}
        />

        {/* Filter Controls */}
        <Group
          gap="xs"
          wrap="wrap"
          justify="center"
        >
          {[
            { value: 'all', label: 'All', icon: <IconList size={18} /> },
            { value: 'horizontal', label: 'Horizontal', icon: <IconStairs size={18} /> },
            { value: 'vertical', label: 'Vertical', icon: <IconArrowBarUp size={18} /> },
            { value: 'extra-welcoming', label: 'Welcoming', icon: <IconSparkles size={18} /> },
            { value: 'available', label: 'Available', icon: <IconChecklist size={18} /> },
            { value: 'u18s', label: 'U18 Friendly', icon: <IconBabyCarriage size={18} /> },
          ].map((filter) => (
            <Button
              key={filter.value}
              variant={filterMode === filter.value ? 'filled' : 'outline'}
              onClick={() => setFilterMode(filter.value as any)}
              leftSection={filter.icon}
              size="compact-md"
              style={{
                flex: '0 1 auto',
                minWidth: '120px',
                padding: '6px 12px',
              }}
            >
              <Text size="sm" style={{ whiteSpace: 'nowrap' }}>{filter.label}</Text>
            </Button>
          ))}
        </Group>
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
      ) : sortMode === 'date' ? (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {sortedTrips.map(trip => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </SimpleGrid>
      ) : (
        <Table.ScrollContainer minWidth={800}>
          <Table verticalSpacing="sm" striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Trip Name</Table.Th>
                <Table.Th>Trip Type</Table.Th>
                <Table.Th>Details</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sortedTrips.map((trip) => {
                const startDate = trip.acf.event_start_date_time 
                  ? new Date(trip.acf.event_start_date_time)
                  : null;
                const isVertical = trip.acf.event_skills_required?.includes('SRT') && 
                  trip.acf.event_type !== 'overnight';
                const isOvernight = trip.acf.event_type === 'overnight';

                return (
                  <Table.Tr
                    key={trip.id}
                    onClick={() => router.push(`/trip/${trip.slug}`)}
                    style={{
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                    role="link"
                    tabIndex={0}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        router.push(`/trip/${trip.slug}`);
                      }
                    }}
                    aria-label={`View ${trip.name} details`}
                  >
                    <Table.Td>
                      {startDate ? (
                        <Group gap="xs">
                          <IconCalendarEvent size={16} />
                          <Text>
                            {startDate.toLocaleDateString('en-GB', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short'
                            })}
                          </Text>
                        </Group>
                      ) : 'TBD'}
                    </Table.Td>
                    <Table.Td>
                      <Text>{trip.name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={
                          trip.acf.event_type === 'training' ? 'blue' :
                          trip.acf.event_type === 'giggletrip' ? 'pink' :
                          trip.acf.event_type === 'overnight' ? 'red' :
                          trip.acf.event_type === 'mystery' ? 'grape' : 'green'
                        }
                        variant="light"
                        leftSection={
                          trip.acf.event_type === 'overnight' ? (
                            <Group gap={4}>
                              <IconStairs size={14} />
                              <IconArrowBarUp size={14} />
                            </Group>
                          ) : trip.acf.event_type === 'training' ? (
                            <IconSchool size={14} style={{ marginRight: 4 }} />
                          ) : trip.acf.event_type === 'giggletrip' ? (
                            <IconSparkles size={14} style={{ marginRight: 4 }} />
                          ) : (trip.acf.event_skills_required === 'Basic SRT' || 
                               trip.acf.event_skills_required === 'Advanced SRT') ? (
                            <IconArrowBarUp size={14} style={{ marginRight: 4 }} />
                          ) : (
                            <IconStairs size={14} style={{ marginRight: 4 }} />
                          )
                        }
                      >
                        {(() => {
                          switch(trip.acf.event_type) {
                            case 'training':
                              return 'Training Event';
                            case 'giggletrip':
                              return 'Giggletrip';
                            case 'overnight':
                              return 'Overnight / Weekend Trip';
                            case 'known':
                              return 'Known Location Trip';
                            case 'mystery':
                              return 'Mystery Trip';
                            default:
                              return trip.acf.event_type?.replace(/-/g, ' ') || 'Caving Trip';
                          }
                        })()}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        {trip.acf.event_skills_required && (
                          <Badge variant="outline" color="blue">
                            Skills: {trip.acf.event_skills_required}
                          </Badge>
                        )}
                        {trip.acf.event_gear_required && trip.acf.event_gear_required !== 'None' && (
                          <Badge variant="outline" color="orange">
                            Gear: {trip.acf.event_gear_required}
                          </Badge>
                        )}
                        {trip.acf.event_u18s_come === 'yes' && (
                          <Badge variant="outline" color="pink">
                            U18 Friendly
                          </Badge>
                        )}
                        {trip.acf.event_non_members_welcome === 'no' && (
                          <Badge variant="outline" color="violet">
                            Members Only
                          </Badge>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Stack>
  );
}
