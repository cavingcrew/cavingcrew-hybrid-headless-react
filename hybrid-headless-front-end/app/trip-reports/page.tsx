"use client";

import { useTripReports } from "@/lib/hooks/useTrips";
import {
	Container,
	Title,
	Text,
	SimpleGrid,
	Loader,
	Alert,
	Center,
	Stack,
	Button,
} from "@mantine/core";
import { IconAlertCircle, IconReportAnalytics } from "@tabler/icons-react";
import TripReportCard from "@/components/trips/TripReportCard";

export default function TripReportsPage() {
	const { data, isLoading, error, refetch } = useTripReports();

	const reports = data?.data || [];

	// Sort reports by date descending (most recent first)
	const sortedReports = [...reports].sort((a, b) => {
		const dateA = a.acf.event_start_date_time
			? new Date(a.acf.event_start_date_time).getTime()
			: 0;
		const dateB = b.acf.event_start_date_time
			? new Date(b.acf.event_start_date_time).getTime()
			: 0;
		return dateB - dateA; // Sort descending
	});

	return (
		<Container size="lg" py="xl">
			<Stack gap="xl">
				<Title order={1} ta="center">
					<Center>
						<IconReportAnalytics style={{ marginRight: "0.5rem" }} /> Trip Reports
					</Center>
				</Title>
				<Text ta="center" c="dimmed">
					Read about past adventures and experiences from Caving Crew trips.
				</Text>

				{isLoading && (
					<Center h={200}>
						<Loader />
					</Center>
				)}

				{error && !isLoading && (
					<Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
						Failed to load trip reports.{" "}
						<Button variant="outline" size="xs" onClick={() => refetch()}>
							Retry
						</Button>
					</Alert>
				)}

				{!isLoading && !error && sortedReports.length === 0 && (
					<Text ta="center" c="dimmed" mt="xl">
						No trip reports have been published yet.
					</Text>
				)}

				{!isLoading && !error && sortedReports.length > 0 && (
					<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
						{sortedReports.map((report) => (
							<TripReportCard key={report.id} report={report} />
						))}
					</SimpleGrid>
				)}
			</Stack>
		</Container>
	);
}
