"use client";

import { useTripReports } from "@/lib/hooks/useTrips";
import {
	Alert,
	Button,
	Center,
	Group,
	Loader,
	SimpleGrid,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { IconAlertCircle, IconReportAnalytics } from "@tabler/icons-react";
import Link from "next/link";
import TripReportCard from "./TripReportCard";

interface TripReportsWidgetViewProps {
	limit?: number; // Optional limit for the number of reports shown
	showViewAllButton?: boolean; // Option to show a "View All" button
}

export function TripReportsWidgetView({
	limit,
	showViewAllButton = false,
}: TripReportsWidgetViewProps) {
	const { data, isLoading, error, refetch } = useTripReports();

	if (isLoading) {
		return (
			<Center h={200}>
				<Loader />
			</Center>
		);
	}

	if (error || !data?.success) {
		return (
			<Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
				Failed to load trip reports.{" "}
				<Button variant="outline" size="xs" onClick={() => refetch()}>
					Retry
				</Button>
			</Alert>
		);
	}

	const reports = data.data || [];
	const displayReports = limit ? reports.slice(0, limit) : reports;

	if (displayReports.length === 0) {
		// Return null to display nothing when there are no reports
		return null;
	}

	return (
		<Stack gap="lg">
			<Title order={2} ta="center">
				<Group justify="center" gap="xs">
					<IconReportAnalytics /> Trip Reports
				</Group>
			</Title>
			<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
				{displayReports.map((report) => (
					<TripReportCard key={report.id} report={report} />
				))}
			</SimpleGrid>
			{showViewAllButton && reports.length > (limit ?? 0) && (
				<Center mt="md">
					<Button
						component={Link}
						href="/trip-reports"
						variant="outline"
						rightSection={<IconReportAnalytics size={16} />}
					>
						View All Trip Reports
					</Button>
				</Center>
			)}
		</Stack>
	);
}
