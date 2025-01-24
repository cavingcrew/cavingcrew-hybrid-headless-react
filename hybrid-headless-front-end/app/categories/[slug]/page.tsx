'use client';

import { Container, Title } from '@mantine/core';
import { useCategoryTrips } from '@/lib/hooks/useTrips';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { CategoryTripsGrid } from '@/components/categories/CategoryTripsGrid';
import type { Trip } from '@/types/api';
import type { PageProps } from 'next/app';
import React from 'react';

// Define proper page props type
interface CategoryPageProps extends PageProps {
  params: { slug: string };
}

interface CategoryResponse {
  products: Trip[];
  category?: {
    name: string;
    slug: string;
  };
}

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

  // Get trips from the response data
  const categoryTrips = (data.data?.products || []).filter((trip: Trip) =>
    trip.categories?.some((cat) => cat.slug === slug)
  );

  // Get category name from response or fallback to slug
  const categoryName = data.data?.category?.name || slug.replace(/-/g, ' ');

  console.log('Filtered trips:', {
    slug,
    count: categoryTrips.length,
    trips: categoryTrips.map((t: Trip) => t.name)
  });

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
