'use client';

import React from 'react';
import { Container, Title, Text, Loader, Center } from '@mantine/core';
import { useTrips } from '../../lib/hooks/useTrips';
import { CategoryTripsGrid } from '../../components/categories/CategoryTripsGrid';

export default function CategoryPage({ params }: { params: { slug: string } }) {
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
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (error || !allTrips?.success) {
    return (
      <Center h={400}>
        <Text>Failed to load trips. Please try again.</Text>
        <button onClick={() => refetch()}>Retry</button>
      </Center>
    );
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
