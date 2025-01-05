import { Container, Title, Text, Center } from '@mantine/core';
import { apiService } from '@/lib/api-service';
import { CategoryTripsGrid } from '@/components/categories/CategoryTripsGrid';
import { notFound } from 'next/navigation';

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  // Fetch trips and categories
  const [tripsResponse, categoriesResponse] = await Promise.all([
    apiService.getTrips(),
    apiService.getCategories()
  ]);

  // Handle errors
  if (!tripsResponse.success || !categoriesResponse.success) {
    return notFound();
  }

  // Get trips filtered by category slug
  const categoryTrips = tripsResponse.data?.filter(trip => 
    trip.categories.some(cat => cat.slug === slug)
  ) || [];

  // Get the category name from categories response
  const category = categoriesResponse.data?.find(cat => cat.slug === slug);
  const categoryName = category?.name || slug.replace(/-/g, ' ');

  return (
    <Container size="lg" py="xl">
      <Title order={1} mb="sm" transform="capitalize">
        {categoryName}
      </Title>
      <Text c="dimmed" mb="xl">
        Showing {categoryTrips.length} trips in this category
      </Text>
      
      {categoryTrips.length > 0 ? (
        <CategoryTripsGrid trips={categoryTrips} />
      ) : (
        <Text>No trips found in this category</Text>
      )}
    </Container>
  );
}
