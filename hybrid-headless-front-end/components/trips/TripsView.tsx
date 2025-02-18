'use client';

import { useState } from 'react';
import { Group, SegmentedControl, Stack, Title, Text, SimpleGrid, Button, Anchor } from '@mantine/core';
import Link from 'next/link';

const CATEGORY_ORDER = [
  'Extra-Welcoming Trips',
  'Evening Trips', 
  'Weekend Trips',
  'Training Trips',
  'Membership',
  'Social Events'
];
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
      return trip.acf.event_type === 'giggletrip';
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
    const mappedCategory = {
      'giggletrips': 'Extra-Welcoming Trips',
      'evening-trips': 'Evening Trips',
      'weekend-trips': 'Weekend Trips',
      'training': 'Training Trips'
    }[category] || category;

    if (!acc[mappedCategory]) acc[mappedCategory] = [];
    acc[mappedCategory].push(trip);
    return acc;
  }, {} as Record<string, Trip[]>);

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
      {CATEGORY_ORDER.map(category => {
        const categoryTrips = tripsByCategory[category] || [];
        
        return (
          <Stack key={category} gap="md">
            <Title order={2}>{category}</Title>
            
            {/* Category-specific descriptions */}
            {category === 'Extra-Welcoming Trips' && (
              <Text>
                We run regular Extra-Welcoming "Giggletrips" to help introduce you to the Crew and to Caving.
                These trips are well suited to:
                <ul>
                  <li>Those brand new to caving</li>
                  <li>Those new to the Crew who want to get a feel for us before joining</li>
                  <li>Those who want to retry caving after a long break</li>
                </ul>
              </Text>
            )}

            {category === 'Evening Trips' && (
              <Text>
                We run regular evening Horizontal Caving trips - usually on Tuesday evenings.
                These are typically most enjoyed by people who've been caving with us before.
              </Text>
            )}

            {category === 'Weekend Trips' && (
              <Text>
                Every month, we run weekend trips to Caving huts and regions around the country.
                Usually we stay in a hut for two days and go caving during the day.
                Typically these are best for people we've caved with before.
              </Text>
            )}

            {category === 'Training Trips' && (
              <Text>
                Want to learn SRT? Horizontal Cave Navigation? How to find your way through a cave? Rigging?
                We run regular training trips and events to help you level up.
                These trips are only available to those with Membership.
              </Text>
            )}

            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
              {categoryTrips.map(trip => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </SimpleGrid>
          </Stack>
        );
      })}

      {/* Membership Section */}
      <Stack gap="md">
        <Title order={2}>Membership</Title>
        <Text>
          Getting membership to the Crew makes it easier and cheaper to access all the trips 
          we do and will take 2 minutes to sign up for.
        </Text>
        <Button component={Link} href="/membership" variant="filled" size="lg">
          Join the Crew
        </Button>
      </Stack>

      {/* Social Events Section */}
      <Stack gap="md">
        <Title order={2}>Social Events</Title>
        <Text>
          We run social events with{' '}
          <Anchor href="https://facebook.com/groups/thesocialclan" target="_blank">
            The Social Clan
          </Anchor>
          {' '}to help everyone relax and get to know each other. Check out the Facebook group to 
          find out about ad-hoc events.
        </Text>
      </Stack>
    </Stack>
  );
}
