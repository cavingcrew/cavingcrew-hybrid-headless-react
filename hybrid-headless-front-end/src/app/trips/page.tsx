import { Container, Title, SimpleGrid } from '@mantine/core';
import { apiService } from '@/lib/api-service';
import { TripCard } from '@/components/trips/TripCard';

export default async function TripsPage() {
  const { data: trips } = await apiService.getTrips();

  return (
    <Container size="lg" py="xl">
      <Title order={1} mb="xl">Available Trips</Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </SimpleGrid>
    </Container>
  );
}
