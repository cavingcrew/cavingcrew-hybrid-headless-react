"use client";

import { useTripParticipants } from "@/lib/hooks/useTripParticipants";
import { useUser } from "@/lib/hooks/useUser";
import type { Trip } from "@/types/api";
import { extractChallengeMetrics } from "@/utils/difficulty-utils";
import {
	formatParticipantList,
	formatRoleName,
	generateTripReportSummary,
} from "@/utils/trip-report-utils";
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
	Table,
	Text,
	Title,
	useMantineTheme,
	Button, // Add Button
	Center, // Add Center
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
	IconArrowRight, // Add IconArrowRight for the button
} from "@tabler/icons-react";
import { useMemo } from "react";
import Link from "next/link"; // Add Link import
import { SensitiveAccessWarning } from "./SensitiveAccessWarning";
import { TripExperience } from "./TripExperience";
import { TripOvernightHut } from "./TripOvernightHut";

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
	// It will automatically adjust based on available participants and canViewNames status
	const summarySentence = generateTripReportSummary(
		trip,
		participants, // Pass the current participants array (might be empty during load)
		canViewNames, // Pass the actual view permission
		participantsData?.data?.participant_count, // Pass the count from the API response
	);

	// Note: We no longer need the explicit "Loading participant details..." text

	// Process participants into roles (only if names can be viewed)
	const rolesMap = useMemo(() => {
		if (!canViewNames || participants.length === 0) {
			return new Map<string, string[]>();
		}

		const map = new Map<string, string[]>();
		participants.forEach((p) => {
			const rawRole = p.order_meta?.cc_volunteer;
			const formattedRole = formatRoleName(rawRole); // Use the new helper
			if (formattedRole && p.first_name) {
				if (!map.has(formattedRole)) {
					map.set(formattedRole, []);
				}
				// Ensure first_name is treated as string before pushing
				const firstName = p.first_name;
				if (typeof firstName === "string") {
					map.get(formattedRole)?.push(firstName);
				}
			}
		});
		return map;
	}, [participants, canViewNames]);

	// Define the desired order for roles
	const roleOrder: string[] = ["Trip Leader", "Seconder", "Trip Reporter"];

	// Get sorted roles based on the defined order, followed by others alphabetically
	const sortedRoles = useMemo(() => {
		const presentRoles = Array.from(rolesMap.keys());
		const orderedRoles = roleOrder.filter((role) =>
			presentRoles.includes(role),
		);
		const otherRoles = presentRoles
			.filter((role) => !roleOrder.includes(role))
			.sort(); // Sort remaining roles alphabetically
		return [...orderedRoles, ...otherRoles];
	}, [rolesMap]);

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

					{/* Photos */}
					{trip.trip_report?.report_gallery &&
						trip.trip_report.report_gallery.length > 0 && (
							<Box>
								<Title order={3} mb="md" mt="lg">
									Photos
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

					{/* Participant Roles Table */}
					{canViewNames && sortedRoles.length > 0 && (
						<Box mt="lg">
							<Title order={3} mb="md">
								Who Did What
							</Title>
							<Table striped withTableBorder withColumnBorders>
								<Table.Tbody>
									{sortedRoles.map((role) => (
										<Table.Tr key={role}>
											<Table.Td fw={500} style={{ width: "30%" }}>
												{role}
											</Table.Td>
											<Table.Td>
												{formatParticipantList(rolesMap.get(role) || [])}
											</Table.Td>
										</Table.Tr>
									))}
								</Table.Tbody>
							</Table>
						</Box>
					)}

					{/* Original Trip Requirements Section (Moved & Modified) */}
					{(trip.acf?.event_skills_required ||
						trip.acf?.event_gear_required ||
						// trip.route?.acf?.route_time_for_eta || // Removed condition for time
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
								{/* Estimated Time Removed */}

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
													People needed their own:{" "}
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

					{/* Conditionally render TripExperience or TripOvernightHut */}
					{trip.acf.event_type === "overnight" ? (
						<TripOvernightHut
							hut={trip.hut}
							tripId={trip.id}
							location={trip.acf.event_location}
							facilities={trip.acf.hut_facilities_description}
							photo={trip.acf.hut_photo}
							isPastTrip={true}
						/>
					) : (
						<TripExperience trip={trip} isPastTrip={true} />
					)}

					{/* CTA for Logged-Out Users */}
					{!Auth.isLoggedIn(user) && (
						<Paper withBorder p="lg" radius="md" mt="xl" shadow="xs">
							<Stack align="center" gap="md">
								<Title order={4} ta="center">
									Inspired to Go Caving?
								</Title>
								<Text ta="center">
									Join one of our Extra Welcoming Giggletrips! They're perfect
									for beginners and those new to the Crew.
								</Text>
								<Button
									component={Link}
									href="/"
									variant="gradient"
									gradient={{ from: "blue", to: "cyan" }}
									rightSection={<IconArrowRight size={18} />}
								>
									Find an Upcoming Trip
								</Button>
							</Stack>
						</Paper>
					)}
				</Stack>
			</Paper>
		</Container>
	);
}
