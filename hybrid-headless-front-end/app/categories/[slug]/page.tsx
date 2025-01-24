'use client';

import { Container, Title } from '@mantine/core';
import { useCategoryTrips } from '@/lib/hooks/useTrips';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { CategoryTripsGrid } from '@/components/categories/CategoryTripsGrid';
import type { Trip } from '@/types/api';
import React from 'react';

interface CategoryPageProps {
  params: { slug: string };
}

// Define a simplified category type that matches what's actually used
type BasicCategory = {
  id: number;
  name: string;
  slug: string;
};

export default function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = params;
  const { data, isLoading, error, refetch } = useCategoryTrips(slug);

  if (isLoading) return <LoadingState />;

  if (error || !data?.success) {
    return <ErrorState 
      message={error?.message || 'Failed to load category'}
      onRetry={refetch}
    />;
  }

  const categoryTrips = (data.data?.trips || []).filter((trip: Trip) =>
    trip.categories?.some((cat: BasicCategory) => cat.slug === slug)
  );

  console.log('Filtered trips:', {
    slug,
    count: categoryTrips.length,
    trips: categoryTrips.map((t: Trip) => t.name)
  });

  const categoryName = data.data?.category?.name || slug.replace(/-/g, ' ');

  return (
    <Container size="lg" py="xl">
      <Title
        order={1}
        mb="sm"
        style={{ textTransform: 'capitalize' }}
      >
        {categoryName}
      </Title>
      <CategoryTripsGrid trips={categoryTrips} />
    </Container>
  );
}
