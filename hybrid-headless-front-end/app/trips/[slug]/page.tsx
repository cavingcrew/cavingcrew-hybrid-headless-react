import { Container, Title, Image, Text, Group, Badge } from '@mantine/core';
import { apiService } from '@/lib/api-service';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TripPage({ params }: PageProps) {
  const { slug } = await params;
  const { data: trip } = await apiService.getTrip(slug);
  
  if (!trip) {
    notFound();
  }

  return (
    <Container size="md" py="xl">
      {trip.images?.[0] && (
        <Image
          src={trip.images[0].src}
          alt={trip.images[0].alt}
          height={400}
          mb="xl"
        />
      )}

      <Title order={1}>{trip.name}</Title>
      
      <Group mt="md" mb="xl">
        <Badge size="lg" variant="filled">
          ${trip.price}
        </Badge>
        <Badge size="lg" color={trip.stock_status === 'instock' ? 'green' : 'red'}>
          {trip.stock_status === 'instock' ? 'Available' : 'Sold Out'}
        </Badge>
      </Group>

      <div 
        dangerouslySetInnerHTML={{ __html: trip.description }}
        className="wp-content"
      />
    </Container>
  );
}
