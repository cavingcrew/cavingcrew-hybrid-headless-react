'use client';

import { Container, Title, Text, Stack, Group, Paper, SimpleGrid, Button, Anchor } from '@mantine/core';
import { useTrips } from '@/lib/hooks/useTrips';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import TripCard from '@/components/trips/TripCard';
import Link from 'next/link';

export default function HomePage() {
  const { data, isLoading, error, refetch } = useTrips();

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !data?.success || !data?.data) {
    return <ErrorState 
      message={error?.message || 'Failed to load trips'} 
      onRetry={() => refetch()}
    />;
  }

  // Filter trips by category
  const giggleTrips = data.data
    ?.filter(trip => 
      trip.categories.some(cat => cat.slug === 'giggletrips')
    ) || [];

  const eveningTrips = data.data
    ?.filter(trip => 
      trip.categories.some(cat => cat.slug === 'evening-trips')
    ) || [];

  const weekendTrips = data.data
    ?.filter(trip => 
      trip.categories.some(cat => cat.slug === 'weekend-trips')
    ) || [];

  return (
    <Container size="lg">
      <Stack gap="xl">
        {/* Hero Section */}
        <Paper p="xl" radius="md" withBorder>
          <Stack gap="md">
            <Title order={1}>We're the Caving Crew!</Title>
            <Text size="lg">
              A bunch of supportive, friendly people who like to encourage each other to cave and eat cake.
            </Text>
          </Stack>
        </Paper>

        {/* Extra-Welcoming Trips Section */}
        <Stack gap="md">
          <Title order={2}>Extra-Welcoming Trips</Title>
          <Text>
            We run regular Extra-Welcoming "Giggletrips" to help introduce you to the Crew and to Caving. 
            These trips are well suited to those brand new to caving, those new to the Crew who want to 
            get a feel for us before joining, and those who want to retry caving after a long break.
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {giggleTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </SimpleGrid>
        </Stack>

        {/* Evening Trips Section */}
        <Stack gap="md">
          <Title order={2}>Evening Trips</Title>
          <Text>
            We run regular evening Horizontal Caving trips - usually, on Tuesday evenings.
            These are typically most enjoyed by people who've been caving with us before.
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {eveningTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </SimpleGrid>
        </Stack>

        {/* Weekend Trips Section */}
        <Stack gap="md">
          <Title order={2}>Weekend Trips</Title>
          <Text>
            Every month, we run weekend trips to Caving huts and regions around the country. 
            Usually we stay in a hut for two days and go caving during the day.
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {weekendTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </SimpleGrid>
        </Stack>

        {/* Training & Membership Section */}
        <Group grow>
          <Paper p="xl" radius="md" withBorder>
            <Stack gap="md">
              <Title order={3}>Training Trips</Title>
              <Text>
                Want to learn SRT? Horizontal Cave Navigation? How to find your way through a cave? Rigging?
                We run regular training trips and events to help you level up.
              </Text>
              <Button component={Link} href="/categories/training" variant="light">
                View Training Trips
              </Button>
            </Stack>
          </Paper>

          <Paper p="xl" radius="md" withBorder>
            <Stack gap="md">
              <Title order={3}>Membership</Title>
              <Text>
                Getting membership to the Crew makes it easier and cheaper to access all the trips 
                we do and will take 2 minutes to sign up for.
              </Text>
              <Button component={Link} href="/membership" variant="filled">
                Join the Crew
              </Button>
            </Stack>
          </Paper>
        </Group>

        {/* Social Events Section */}
        <Paper p="xl" radius="md" withBorder>
          <Stack gap="md">
            <Title order={3}>Social Events</Title>
            <Text>
              We run social events with{' '}
              <Anchor href="https://facebook.com/groups/thesocialclan" target="_blank">
                The Social Clan
              </Anchor>
              {' '}to help everyone relax and get to know each other. Check out the Facebook group to 
              find out about ad-hoc events.
            </Text>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
