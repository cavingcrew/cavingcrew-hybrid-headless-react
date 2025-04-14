"use client";

import { useTripParticipants } from "@/lib/hooks/useTripParticipants";
import { useUser } from "@/lib/hooks/useUser";
import type { Trip } from "@/types/api"; // Removed TripParticipant import as it's handled in util
import { extractChallengeMetrics } from "@/utils/difficulty-utils";
import { generateTripReportSummary } from "@/utils/trip-report-utils"; // Import the new util
// Removed formatParticipantCount import as it's handled in util
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
	IconClock, // Added IconClock
	IconHeartHandshake,
	IconHistory,
	IconInfoCircle,
	IconMapPin,
	IconSchool,
	IconSparkles,
	IconTools,
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
		// Removed renderParticipantInfo function
	};

	// Generate the summary sentence using the utility function
	const summarySentence =
		!participantsLoading && participants.length > 0
			? generateTripReportSummary(trip, participants, canViewNames)
			: participantsLoading
				? "Loading participant details..."
				: generateTripReportSummary(trip, [], false); // Fallback if error or no participants

	return (
		<Container size="md" py="xl">
			<Paper shadow="sm" p="lg" radius="md" withBorder>
				<Stack gap="lg">
					{/* Header */}
					<Title order={2} ta="center">
						{trip.name} {/* Removed "Trip Report:" prefix */}
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
						{/* Removed By: Author section */}
					</Group>

					<Divider />

					{/* Summary Sentence - Now uses the generated sentence */}
					<Text ta="left" fz="lg" style={{ lineHeight: 1.6 }}>
						{summarySentence}
					</Text>

					{/* Report Content */}
					{trip.trip_report?.report_content && (
						<Box>
							<Title order={3} mb="sm">
								{(() => {
									// Determine reporter name
									let reporterName = trip.trip_report?.report_author;
									if (
										!reporterName &&
										canViewNames &&
										participants.length > 0
									) {
										const reporter = participants.find((p) =>
											p.order_meta?.cc_volunteer
												?.toLowerCase()
												.includes("reporter"),
										);
										if (reporter) {
											reporterName = reporter.first_name;
										}
									}
									return reporterName
										? `${reporterName} writes:`
										: "Report Details";
								})()}
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
													// Prioritize larger sizes for better quality
													image.sizes?.large?.file ||
													image.sizes?.medium_large?.file ||
													image.url // Fallback to original URL
												}
												alt={image.alt || `Trip report image ${image.ID}`}
												// Remove fixed height here - let Carousel's height dictate
												fit="contain" // Keep contain to see the whole image
												style={{ width: "100%", height: "100%" }} // Make image fill the slide area
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

					{/* Original Trip Requirements Section (Moved & Modified) */}
					{(trip.acf?.event_skills_required ||
						trip.acf?.event_gear_required ||
						trip.route?.acf?.route_time_for_eta || // Added condition for time
						trip.acf?.event_must_caved_with_us_before ||
						trip.acf?.event_non_members_welcome ||
						(trip.acf?.event_volunteering_required &&
							trip.acf.event_volunteering_required > 0) ||
						(trip.acf?.event_attendance_required &&
							trip.acf.event_attendance_required > 0) ||
						trip.acf?.event_u18s_come) && (
						<Paper withBorder p="md" radius="md" mt="lg">
							<Title order={3} mb="md">
								Original Trip Requirements
							</Title>
							<Stack gap="md">
								{/* Estimated Time */}
								{trip.route?.acf?.route_time_for_eta && (
									<Group gap="xs">
										<IconClock size={20} />
										<div>
											<Text fw={500}>Estimated Duration:</Text>
											<Text>{trip.route.acf.route_time_for_eta} hours</Text>
										</div>
									</Group>
								)}

								{/* Skills Required */}
								{trip.acf?.event_skills_required && (
									<Group gap="xs">
										<IconSchool size={20} />
										<div>
											<Text fw={500}>Skills Required:</Text>
											<Text>{trip.acf.event_skills_required}</Text>
										</div>
									</Group>
								)}

								{/* Gear Required (Modified Logic) */}
								{trip.acf?.event_gear_required && (
									<Group gap="xs">
										<IconTools size={20} />
										<div>
											<Text fw={500}>Gear:</Text>
											{trip.acf.event_gear_required === "None" ? (
												<Text>
													All required gear could be borrowed from the Crew.
												</Text>
											) : (
												<Text>
													Participants needed their own:{" "}
													{trip.acf.event_gear_required}
												</Text>
											)}
										</div>
									</Group>
								)}

								{/* Previous Experience */}
								{trip.acf?.event_must_caved_with_us_before && (
									<Group gap="xs">
										<IconHistory size={20} />
										<div>
											<Text fw={500}>Previous Experience:</Text>
											<Text>
												{trip.acf.event_must_caved_with_us_before === "yes"
													? "Must have caved with us before"
													: "No previous experience needed"}
											</Text>
										</div>
									</Group>
								)}

								{/* Membership Requirement */}
								{trip.acf?.event_non_members_welcome && (
									<Group gap="xs">
										<IconUsers size={20} />
										<div>
											<Text fw={500}>Membership:</Text>
											<Text>
												{trip.acf.event_non_members_welcome === "yes"
													? "Was open to all"
													: "Was required to participate"}
											</Text>
											{trip.acf.event_non_members_welcome === "no" &&
												trip.acf.event_why_are_only_members_allowed && (
													<Text size="sm" c="dimmed" mt={4}>
														Reason:{" "}
														{trip.acf.event_why_are_only_members_allowed}
													</Text>
												)}
										</div>
									</Group>
								)}

								{/* Volunteering Requirement */}
								{trip.acf?.event_volunteering_required &&
									trip.acf.event_volunteering_required > 0 && (
										<Group gap="xs">
											<IconHeartHandshake size={20} />
											<div>
												<Text fw={500}>Volunteering:</Text>
												<Text>
													Required contribution to{" "}
													{trip.acf.event_volunteering_required} events
												</Text>
											</div>
										</Group>
									)}

								{/* Attendance Requirement */}
								{trip.acf?.event_attendance_required &&
									trip.acf.event_attendance_required > 0 && (
										<Group gap="xs">
											<IconCalendarEvent size={20} />
											<div>
												<Text fw={500}>Minimum Attendance:</Text>
												<Text>
													Required attendance at{" "}
													{trip.acf.event_attendance_required} events
												</Text>
											</div>
										</Group>
									)}

								{/* Age Restrictions */}
								{trip.acf?.event_u18s_come && (
									<Group gap="xs">
										<IconUser size={20} />
										<div>
											<Text fw={500}>Age Restrictions:</Text>
											<Text>
												{trip.acf.event_u18s_come === "yes"
													? "Was open to accompanied under-18s"
													: "Was 18+ only"}
											</Text>
										</div>
									</Group>
								)}
							</Stack>
						</Paper>
					)}
				</Stack>
			</Paper>
		</Container>
	);
}
