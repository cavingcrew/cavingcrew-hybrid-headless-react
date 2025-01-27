"use client";

import dynamic from "next/dynamic";
import React from "react";
import { LoadingState } from "../../components/ui/LoadingState";

const CatchAllContent = dynamic(
	() => import("./CatchAllContent").then((mod) => mod.CatchAllContent),
	{
		loading: () => <LoadingState />,
		ssr: false,
	},
);

export default function CatchAllPage() {
	return <><p>ALERT ALERT</p><CatchAllContent /></>;
}
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useTrip } from '@/lib/hooks/useTrips';
import { Container } from '@mantine/core';
import { TripDetails } from '@/components/trips/TripDetails';
import dynamic from 'next/dynamic';

export default function CatchAllPage() {
  const params = useParams();
  const [path, setPath] = useState<string[]>([]);
  
  useEffect(() => {
    // Get the current path from window.location
    const currentPath = window.location.pathname.split('/').filter(Boolean);
    setPath(currentPath);
  }, []);

  // Handle trip pages
  if (path[0] === 'trip' && path[1]) {
    const { data, isLoading, error, refetch } = useTrip(path[1]);

    if (isLoading) return <LoadingState />;

    if (error || !data?.success || !data?.data) {
      return (
        <ErrorState
          message={error?.message || 'Failed to load trip'}
          onRetry={() => refetch()}
        />
      );
    }

    return (
      <Container size="lg" py="xl">
        <TripDetails trip={data.data} />
      </Container>
    );
  }

  // Handle trips listing
  if (path[0] === 'trips') {
    const TripsPage = dynamic(() => import('../trips/page'), {
      loading: () => <LoadingState />
    });
    return <TripsPage />;
  }

  // Handle categories
  if (path[0] === 'categories' && path[1]) {
    const CategoryPage = dynamic(() => import('../categories/[slug]/page'), {
      loading: () => <LoadingState />
    });
    return <CategoryPage params={{ slug: path[1] }} />;
  }

  // Handle home page
  if (path.length === 0) {
    const HomePage = dynamic(() => import('../page'), {
      loading: () => <LoadingState />
    });
    return <HomePage />;
  }

  // Default to error state for unknown routes
  return <ErrorState message="Page not found" />;
}
