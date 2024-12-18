import { Container, Title, Text, SimpleGrid } from '@mantine/core';
import { apiService } from '@/lib/api-service';
import { TripCard } from '@/components/trips/TripCard';
import { notFound } from 'next/navigation';

export default async function CategoryPage({
  params,
}: {
  params: { slug: string }
}) {
  const { data: trips } = await apiService.getTripsByCategory(params.slug);
  
  if (!trips.length) {
    notFound();
  }

  return (
    <Container size="lg" py="xl">
      <Title order={1} mb="sm">{params.slug}</Title>
      <Text c="dimmed" mb="xl">
        Showing {trips.length} trips in this category
      </Text>
      
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </SimpleGrid>
    </Container>
  );
}
