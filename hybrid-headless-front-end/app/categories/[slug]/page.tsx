import { Container, Title, Text, SimpleGrid } from '@mantine/core';
import { apiService } from '@/lib/api-service';
import { TripCard } from '@/components/trips/TripCard';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const { data: trips } = await apiService.getTripsByCategory(slug);
  
  if (!trips.length) {
    notFound();
  }

  return (
    <Container size="lg" py="xl">
      <Title order={1} mb="sm">{slug}</Title>
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
