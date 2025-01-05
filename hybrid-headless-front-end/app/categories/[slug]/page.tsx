import { Container, Title, Text } from '@mantine/core';
import { apiService } from '@/lib/api-service';
import { notFound } from 'next/navigation';
import { CategoryTripsGrid } from '@/components/categories/CategoryTripsGrid';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const { data: trips, success } = await apiService.getTripsByCategory(slug);
  
  // Handle null data or unsuccessful response
  if (!success || !trips || trips.length === 0) {
    notFound();
  }

  return (
    <Container size="lg" py="xl">
      <Title order={1} mb="sm">{slug}</Title>
      <Text c="dimmed" mb="xl">
        Showing {trips.length} trips in this category
      </Text>
      
      <CategoryTripsGrid trips={trips} />
    </Container>
  );
}
