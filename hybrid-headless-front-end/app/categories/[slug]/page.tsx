"use client";

import { Button, Center, Container, Loader, Text, Title } from "@mantine/core";
import React from "react";
import { CategoryTripsGrid } from "../../../components/categories/CategoryTripsGrid";
import { useTrips } from "../../../lib/hooks/useTrips";

export default function CategoryPage({ params }: { params: { slug: string } }) {
	const { data: allTrips, isLoading, error, refetch } = useTrips();

	// Get trips filtered by category slug
	const categoryTrips =
		allTrips?.data?.filter((trip) =>
			trip.categories.some((cat) => cat.slug === params.slug),
		) || [];

	// Get the category name from the first matching trip
	const categoryName =
		categoryTrips[0]?.categories.find((cat) => cat.slug === params.slug)
			?.name || params.slug.replace(/-/g, " ");

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
				<Button onClick={() => refetch()} type="button" variant="light">
				  Retry
				</Button>
			</Center>
		);
	}

	return (
		<Container size="lg" py="xl">
			<Title order={1} mb="sm" style={{ textTransform: "capitalize" }}>
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
