import { Container, Title, Text, SimpleGrid } from '@mantine/core';
import { TripCard } from '@/components/trips/TripCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';

export default async function HomePage() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/hybrid-headless/v1/products`);
    if (!response.ok) throw new Error('Failed to fetch trips');
    
    const data = await response.json();
    
    return (
      <Container size="lg">
        <Title order={1} mb="xl">Welcome to Travel Adventures</Title>
        <Text size="lg" mb="xl">
          Discover amazing trips and adventures around the world. Book your next unforgettable experience with us.
        </Text>
        
        <Title order={2} mb="lg">Featured Trips</Title>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {data.products.map((trip: any) => (
            <TripCard key={trip.id} trip={{
              id: trip.id,
              title: trip.name,
              slug: trip.slug,
              excerpt: trip.short_description,
              price: trip.price,
              stockStatus: trip.stock_status,
              featuredImage: trip.images[0] ? {
                url: trip.images[0].src,
                alt: trip.images[0].alt
              } : null
            }} />
          ))}
        </SimpleGrid>
      </Container>
    );
  } catch (error) {
    return <ErrorState message="Failed to load trips" />;
  }
}
