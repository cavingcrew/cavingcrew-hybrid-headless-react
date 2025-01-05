'use client';

import { Container, Title, Text } from '@mantine/core';
import { useTripsByCategory } from '@/lib/hooks/useTrips';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { CategoryTripsGrid } from '@/components/categories/CategoryTripsGrid';
import { use } from 'react';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = use(params);
  const { data, isLoading, error, refetch } = useTripsByCategory(resolvedParams.slug);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !data?.success || !data?.data) {
    return <ErrorState 
      message={error?.message || 'Failed to load category'} 
      onRetry={() => refetch()}
    />;
  }

  return (
    <Container size="lg" py="xl">
      <Title order={1} mb="sm">{resolvedParams.slug}</Title>
      <Text c="dimmed" mb="xl">
        Showing {data.data.length} trips in this category
      </Text>
      
      <CategoryTripsGrid trips={data.data} />
    </Container>
  );
}
