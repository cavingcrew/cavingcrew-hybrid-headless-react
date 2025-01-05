'use client';

import React from 'react';
import { Container, Title, Text } from '@mantine/core';
import { useTripsByCategory } from '../../lib/hooks/useTrips';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { CategoryTripsGrid } from '../../components/categories/CategoryTripsGrid';

interface CategoryPageProps {
  params: { slug: string };
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const { data, isLoading, error, refetch } = useTripsByCategory(params.slug);

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
