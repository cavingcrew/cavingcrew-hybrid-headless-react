"use client";

import { useTripParticipants } from "@/lib/hooks/useTripParticipants";
import { useUser } from "@/lib/hooks/useUser";
import type { Trip, TripParticipant } from "@/types/api";
import { extractChallengeMetrics } from "@/utils/difficulty-utils";
import { formatParticipantCount } from "@/utils/trip-participant-utils";
import { Auth } from "@/utils/user-utils";
import { Carousel } from "@mantine/carousel";
import {
	Alert,
	Anchor,
	Badge,
	Box,
	Container,
	Divider,
	Group,
	Image,
	Loader,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	Title,
	useMantineTheme,
} from "@mantine/core";
import {
	IconAlertCircle,
	IconCalendarEvent,
	IconMapPin,
	IconUser,
	IconUsers,
} from "@tabler/icons-react";
import { SensitiveAccessWarning } from "./SensitiveAccessWarning";
import { TripChallengeIndicator } from "./TripChallengeIndicator";

interface TripReportDetailsViewProps {
	trip: Trip; // Report data is nested within the Trip object
}

const formatDate = (dateString?: string): string => {
	if (!dateString) return "Date Unknown";
	try {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-GB", {
			weekday: "long",
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	} catch {
		return "Invalid Date";
	}
};

export function TripReportDetailsView({ trip }: TripReportDetailsViewProps) {
	const theme = useMantineTheme();
	const { user } = useUser();
	const {
		data: participantsData,
		isLoading: participantsLoading,
		error: participantsError,
	} = useTripParticipants(trip.id);

	const participants = participantsData?.data?.participants || [];
	const accessLevel = participantsData?.data?.access_level || "public";
	const canViewNames = accessLevel !== "public";
	const participantCount =
		participantsData?.data?.participant_count ?? participants.length;

	const challengeMetricsResult = extractChallengeMetrics(trip.route?.acf);

	const isSensitive =
		!!trip.route?.acf?.route_entrance_location_id?.acf
			?.location_sensitive_access;
	const canViewSensitiveDetails = Auth.canViewSensitive(
		user,
		trip,
		accessLevel,
	);

	const getLocationName = () => {
		if (isSensitive && !canViewSensitiveDetails) {
			return "a sensitive location";
		}
		return (
			trip.route?.acf?.route_entrance_location_id?.title ||
			trip.acf.event_cave_name ||
			trip.acf.event_location ||
			"an unknown location"
		);
	};

	const getRegion = () => {
		if (isSensitive && !canViewSensitiveDetails) {
			return null; // Don't show region for sensitive locations if user lacks access
		}
		return (
			trip.route?.acf?.route_entrance_location_id?.acf?.location_caving_region
				?.post_title ||
			trip.acf.event_possible_location ||
			null
		);
	};

	const getRouteName = () => {
		if (isSensitive && !canViewSensitiveDetails) {
			return null; // Don't show route name for sensitive locations if user lacks access
		}
		return trip.route?.acf?.route_name || null;
	};

	const renderParticipantInfo = () => {
		if (participantsLoading) {
			return <Loader size="xs" />;
		}
		if (participantsError) {
			return (
				<Text c="red" size="sm">
					Error loading participants
				</Text>
			);
		}

		if (canViewNames && participants.length > 0) {
			return participants.map((p) => p.first_name).join(", ");
		}
		return formatParticipantCount(participantCount, accessLevel);
	};

	return (
		<Container size="md" py="xl">
			<Paper shadow="sm" p="lg" radius="md" withBorder>
				<Stack gap="lg">
					{/* Header */}
					<Title order={2} ta="center">
						Trip Report: {trip.name}
					</Title>

					{/* Sensitive Access Warning */}
					<SensitiveAccessWarning isVisible={isSensitive} />

					{/* Meta Info */}
					<Group justify="center" gap="xl">
						{trip.acf.event_start_date_time && (
							<Group gap="xs">
								<IconCalendarEvent size={18} opacity={0.7} />
								<Text size="sm">
									{formatDate(trip.acf.event_start_date_time)}
								</Text>
							</Group>
						)}
						{trip.trip_report?.report_author && (
							<Group gap="xs">
								<IconUser size={18} opacity={0.7} />
								<Text size="sm">By: {trip.trip_report.report_author}</Text>
							</Group>
						)}
					</Group>

					<Divider />

					{/* Summary Sentence */}
					<Text ta="center" fz="lg" style={{ lineHeight: 1.6 }}>
						On {formatDate(trip.acf.event_start_date_time)},{" "}
						<Text span inherit> {/* Use inherit to match surrounding text style */}
							{renderParticipantInfo()}
						</Text>{" "}
						{participantCount === 1 ? "person" : "people"} went to {getLocationName()}
						{getRegion() && ` in ${getRegion()}`}
						{getRouteName() && ` to explore the ${getRouteName()} route`}.
					</Text>

					{/* Report Content */}
					{trip.trip_report?.report_content && (
						<Box>
							<Title order={3} mb="sm">
								Report Details
							</Title>
							<Box
								dangerouslySetInnerHTML={{
									__html: trip.trip_report.report_content,
								}}
								style={{ lineHeight: 1.6 }}
							/>
						</Box>
					)}

					{/* Gallery */}
					{trip.trip_report?.report_gallery &&
						trip.trip_report.report_gallery.length > 0 && (
							<Box>
								<Title order={3} mb="md" mt="lg">
									Gallery
								</Title>
								<Carousel
									withIndicators
									withControls // Add previous/next buttons
									height={400}
									slideSize="100%" // Show one full image at a time
									slideGap={0} // No gap between full slides
									loop
									align="center" // Center the single slide
								>
									{trip.trip_report.report_gallery.map((image) => (
										<Carousel.Slide key={image.ID}>
											<Image
												src={
													image.sizes?.large?.file ||
													image.sizes?.medium_large?.file ||
													image.url
												}
												alt={image.alt || `Trip report image ${image.ID}`}
												height={400}
												fit="contain"
											/>
											{image.caption && (
												<Text ta="center" size="sm" mt="xs" c="dimmed">
													{image.caption}
												</Text>
											)}
										</Carousel.Slide>
									))}
								</Carousel>
							</Box>
						)}

					{/* Challenge Indicator */}
					{challengeMetricsResult && (
						<Box mt="xl">
							<Title order={3} ta="center" mb="md">
								Route Challenge Profile
							</Title>
							<TripChallengeIndicator
								metrics={challengeMetricsResult.metrics}
								weightedRank={challengeMetricsResult.weightedRank}
							/>
						</Box>
					)}
				</Stack>
			</Paper>
		</Container>
	);
}
