'use client';

import { Container, Title } from '@mantine/core';
import { useCategoryTrips } from '@/lib/hooks/useTrips';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { CategoryTripsGrid } from '@/components/categories/CategoryTripsGrid';
import type { Trip } from '@/types/api';
import React from 'react';

interface CategoryPageProps {
  params: {
    slug: string;
  };
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

  const responseData = data.data as CategoryResponse;
  const categoryTrips = (responseData.products || []).filter((trip: Trip) =>
    trip.categories?.some((cat) => cat.slug === slug)
  );
  const categoryName = responseData.category?.name || slug.replace(/-/g, ' ');

  return (
    <Container size="lg" py="xl">
      <Title order={1} mb="sm" style={{ textTransform: 'capitalize' }}>
        {categoryName}
      </Title>
      <CategoryTripsGrid trips={categoryTrips} />
    </Container>
  );
}
