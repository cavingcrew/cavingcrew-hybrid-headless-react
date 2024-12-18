import { Container, Title, Image, Text, Group, Badge } from '@mantine/core';
import { apiService } from '@/lib/api-service';
import { notFound } from 'next/navigation';

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function TripPage({ params }: PageProps) {
  const { data: trip } = await apiService.getTrip(params.slug);
  
  if (!trip) {
    notFound();
  }

  return (
    <Container size="md" py="xl">
      {trip.featuredImage && (
        <Image
          src={trip.featuredImage.url}
          alt={trip.featuredImage.alt}
          height={400}
          mb="xl"
        />
      )}

      <Title order={1}>{trip.title}</Title>
      
      <Group mt="md" mb="xl">
        <Badge size="lg" variant="filled">
          ${trip.price}
        </Badge>
        <Badge size="lg" color={trip.stockStatus === 'instock' ? 'green' : 'red'}>
          {trip.stockStatus === 'instock' ? 'Available' : 'Sold Out'}
        </Badge>
        <Badge size="lg" variant="outline">
          {trip.duration} days
        </Badge>
      </Group>

      <div 
        dangerouslySetInnerHTML={{ __html: trip.content }}
        className="wp-content"
      />
    </Container>
  );
}
