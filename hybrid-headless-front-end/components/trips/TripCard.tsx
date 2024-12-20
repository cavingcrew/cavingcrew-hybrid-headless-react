import { Card, Image, Text, Badge, Group, Button } from '@mantine/core';
import Link from 'next/link';
import type { Trip } from '@/types/api';

interface TripCardProps {
  trip: Trip;
}

export function TripCard({ trip }: TripCardProps) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      {trip.featuredImage && (
        <Card.Section>
          <Image
            src={trip.featuredImage.url}
            alt={trip.featuredImage.alt}
            height={160}
          />
        </Card.Section>
      )}

      <Group justify="space-between" mt="md" mb="xs">
        <Text fw={500}>{trip.title}</Text>
        <Badge color={trip.stockStatus === 'instock' ? 'green' : 'red'}>
          {trip.stockStatus === 'instock' ? 'Available' : 'Sold Out'}
        </Badge>
      </Group>

      <Text size="sm" c="dimmed" lineClamp={2}>
        {trip.excerpt}
      </Text>

      <Group mt="md" justify="space-between">
        <Text size="xl" fw={700} c="blue">
          ${trip.price}
        </Text>
        <Button 
          component={Link} 
          href={`/trips/${trip.slug}`}
          variant="light"
        >
          View Details
        </Button>
      </Group>
    </Card>
  );
}
