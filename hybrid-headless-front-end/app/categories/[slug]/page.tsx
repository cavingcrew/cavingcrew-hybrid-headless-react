import { Container, Title, Text } from '@mantine/core';
import { apiService } from '@/lib/api-service';
import { CategoryTripsGrid } from '@/components/categories/CategoryTripsGrid';
import { notFound } from 'next/navigation';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = params;

  // Debugging: Log the received params
  console.log('Received params:', params);

  try {
    // Fetch trips and categories
    const [tripsResponse, categoriesResponse] = await Promise.all([
      apiService.getTrips(),
      apiService.getCategories()
    ]);

    // Debugging: Log the API responses
    console.log('Trips response:', tripsResponse);
    console.log('Categories response:', categoriesResponse);

    // Handle errors
    if (!tripsResponse.success || !categoriesResponse.success) {
      console.error('Failed to fetch data:', {
        tripsSuccess: tripsResponse.success,
        categoriesSuccess: categoriesResponse.success
      });
      return notFound();
    }

    // Ensure tripsResponse.data.products is an array
    const tripsData = Array.isArray(tripsResponse.data?.products)
      ? tripsResponse.data.products
      : [];

    // Get trips filtered by category slug
    const categoryTrips = tripsData.filter(trip =>
      trip.categories?.some(cat => cat.slug === slug)
    );

    // Debugging: Log filtered trips
    console.log('Filtered trips:', {
      slug,
      count: categoryTrips.length,
      trips: categoryTrips.map(t => t.name)
    });

    // Get the category name from categories response
    const category = categoriesResponse.data?.find(cat => cat.slug === slug);
    const categoryName = category?.name || slug.replace(/-/g, ' ');

    // Debugging: Log final data
    console.log('Final data:', {
      categoryName,
      tripCount: categoryTrips.length
    });

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
  } catch (error) {
    console.error('Error in CategoryPage:', error);
    return notFound();
  }
}
