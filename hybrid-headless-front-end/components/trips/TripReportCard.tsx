"use client";

import { useTripCache } from "@/lib/hooks/useCache";
import {
	Badge,
	Box,
	Button,
	Card,
	Group,
	Image,
	Stack,
	Text,
} from "@mantine/core";
import { IconCalendarEvent, IconUser } from "@tabler/icons-react";
import Link from "next/link";
import type { Trip } from "../../types/api";

interface TripReportCardProps {
	report: Trip; // Using Trip type as reports are also products
}

const formatDate = (dateString?: string): string => {
	if (!dateString) return "Date Unknown";
	try {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-GB", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	} catch {
		return "Invalid Date";
	}
};

export default function TripReportCard({ report }: TripReportCardProps) {
	const eventDate = report.acf.event_start_date_time
		? formatDate(report.acf.event_start_date_time)
		: null;

	const reportAuthor = report.trip_report?.report_author || "Anonymous";
	const reportContentPreview =
		report.trip_report?.report_content
			?.replace(/<[^>]*>/g, "") // Strip HTML
			.substring(0, 100) || "No description available"; // Truncate

	const firstImage = report.trip_report?.report_gallery?.[0];

	return (
		<Link
			href={`/trip/${report.slug}`}
			style={{ textDecoration: "none", color: "inherit" }}
			onMouseEnter={() => useTripCache().prefetchTrip(report.slug)}
		>
			<Card
				shadow="sm"
				padding="lg"
				radius="md"
				withBorder
				style={{ cursor: "pointer", height: "100%" }} // Ensure consistent height
			>
				{firstImage && (
					<Card.Section>
						<Image
							src={
								firstImage.sizes?.medium_large?.file ||
								firstImage.sizes?.large?.file ||
								firstImage.url // Fallback to full URL
							}
							alt={firstImage.alt || "Trip report image"}
							height={180}
							style={{
								objectFit: "cover",
								width: "100%",
							}}
						/>
					</Card.Section>
				)}

				<Stack justify="space-between" style={{ height: "100%" }}>
					<Box>
						<Group justify="space-between" mt="md" mb="xs">
							<Text fw={500} lineClamp={2}>
								{report.name}
							</Text>
						</Group>
						{eventDate && (
							<Group gap="xs" mb="xs">
								<IconCalendarEvent size={16} opacity={0.7} />
								<Text size="sm" c="dimmed">
									{eventDate}
								</Text>
							</Group>
						)}
						{/* Removed Author Line */}

						<Text size="sm" c="dimmed" lineClamp={3}>
							{reportContentPreview}...
						</Text>
					</Box>

					{/* Removed Read Report Button */}
				</Stack>
			</Card>
		</Link>
	);
}
