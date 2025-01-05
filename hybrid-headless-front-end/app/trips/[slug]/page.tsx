import { Container } from '@mantine/core';
import { apiService } from '@/lib/api-service';
import { notFound } from 'next/navigation';
import { TripDetails } from '@/components/trips/TripDetails';

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
    <Container size="lg" py="xl">
      <TripDetails trip={trip} />
    </Container>
  );
}
