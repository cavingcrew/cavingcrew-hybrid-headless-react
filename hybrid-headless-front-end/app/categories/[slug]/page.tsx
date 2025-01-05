'use client';

import React from 'react';
import { Container, Title, Text } from '@mantine/core';
import { useTrips } from '../../lib/hooks/useTrips';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { CategoryTripsGrid } from '../../components/categories/CategoryTripsGrid';
import type { NextPage } from 'next';

interface CategoryPageParams {
  slug: string;
}

interface CategoryPageProps {
  params: CategoryPageParams;
  searchParams?: { [key: string]: string | string[] | undefined };
}

const CategoryPage: NextPage<CategoryPageProps> = ({ params }) => {
  const { data: allTrips, isLoading, error, refetch } = useTrips();

  // Get trips filtered by category slug
  const categoryTrips = allTrips?.data?.filter(trip => 
    trip.categories.some(cat => cat.slug === params.slug)
  ) || [];

  // Get the category name from the first matching trip
  const categoryName = categoryTrips[0]?.categories.find(
    cat => cat.slug === params.slug
  )?.name || params.slug.replace(/-/g, ' ');

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !allTrips?.success) {
    return <ErrorState 
      message={error?.message || 'Failed to load trips'} 
      onRetry={() => refetch()}
    />;
  }

  return (
    <Container size="lg" py="xl">
      <Title order={1} mb="sm" style={{ textTransform: 'capitalize' }}>
        {categoryName}
      </Title>
      <Text c="dimmed" mb="xl">
        Showing {categoryTrips.length} trips in this category
      </Text>
      
      {categoryTrips.length > 0 ? (
        <CategoryTripsGrid trips={categoryTrips} />
      ) : (
        <Text>No trips found in this category</Text>
      )}
    </Container>
  );
}
