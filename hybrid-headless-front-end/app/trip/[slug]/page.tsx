'use client';

import React, { use } from "react";
import { TripDetails } from "@/components/trips/TripDetails";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useTrip } from "@/lib/hooks/useTrips"; // useTrips might not be needed here anymore
import { Container, Group, Badge, Title } from "@mantine/core";
import { TripReportDetailsView } from "@/components/trips/TripReportDetailsView"; // Import the new view

export default function TripPage({
	params,
}: { params: Promise<{ slug: string }> }) {
	const { slug } = use(params);
	// Fetch the specific trip/report data using useTrip
	const { data, isLoading, isFetching, error, refetch } = useTrip(slug);

	const trip = data?.data; // The fetched data could be a trip or a report
	const showStaleData = !!trip && isFetching;

	// Check if the fetched data represents a trip report
	const isTripReport = !!(
		trip?.trip_report?.report_content &&
		trip.trip_report.report_content.trim() !== ""
	);

	if (isLoading && !trip) {
		return <LoadingState />;
  }

  if (error || !data?.success || !trip) {
    return (
      <ErrorState
        message={error?.message || 'Failed to load trip'}
        onRetry={() => refetch()}
      />
    );
	}

	return (
		<Container size="lg" py="xl">
			{/* Render based on whether it's a report or a regular trip */}
			{isTripReport ? (
				// Render Trip Report View
				// No need for the Title/Badge group here as TripReportDetailsView handles its own title
				<TripReportDetailsView trip={trip} />
			) : (
				// Render Regular Trip Details View
				<>
					<Group justify="space-between" align="center" mb="xl">
						<Title order={1}>{trip.name}</Title>
						{showStaleData && (
							<Badge color="yellow" variant="light">
								Updating trip details...
							</Badge>
						)}
					</Group>
					<TripDetails trip={trip} />
				</>
			)}
		</Container>
	);
}
