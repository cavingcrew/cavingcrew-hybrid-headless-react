'use client';

import { Container, Title } from '@mantine/core';
import { useCategoryTrips } from '@/lib/hooks/useTrips';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { CategoryTripsGrid } from '@/components/categories/CategoryTripsGrid';
import type { Trip, CategoryResponse } from '@/types/api';
import React from 'react';

interface CategoryPageProps {
    params: {
        slug: string;
    };
}


export default function CategoryPage({ params }: CategoryPageProps) {
    const { slug } = params;
    const { data, isLoading, error, refetch } = useCategoryTrips(slug);

    if (isLoading) return <LoadingState />;

    if (error || !data?.success || !data.data) {
        return <ErrorState
            message={error?.message || 'Failed to load category'}
            onRetry={refetch}
        />;
    }

    const categoryTrips = data.data.products.filter((trip) =>
        trip.categories?.some((cat) => cat.slug === slug)
    );
    const categoryName = data.data.category?.name || slug.replace(/-/g, ' ');

    return (
        <Container size="lg" py="xl">
            <Title order={1} mb="sm" style={{ textTransform: 'capitalize' }}>
                {categoryName}
            </Title>
            <CategoryTripsGrid trips={categoryTrips} />
        </Container>
    );
}
