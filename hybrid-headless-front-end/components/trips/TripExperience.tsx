"use client";

import {
	Alert,
	Anchor,
	Badge,
	Box,
	Group,
	Grid,
	List,
	Paper,
	Stack,
	Text,
	ThemeIcon,
	Title,
	Rating,
} from "@mantine/core";
import {
	IconArrowsVertical,
	IconCompass,
	IconFirstAidKit,
	IconInfoCircle,
	IconMountain,
	IconRuler,
	IconShirt,
	IconStar,
	IconTool,
	IconUser,
	IconWalk,
	IconClock,
	IconMoodSmile,
	IconMountainOff,
	IconShoe,
	IconHeadset,
	IconBolt,
	IconThumbUp,
	IconAlertTriangle,
	IconLock,
} from "@tabler/icons-react";
import { SensitiveAccessWarning } from './SensitiveAccessWarning';
import React from "react";
import type { Trip } from "../../types/api";
import { extractChallengeMetrics } from "../../utils/difficulty-utils";
import { TripChallengeIndicator } from "./TripChallengeIndicator";
import { TripObjectionHandling } from "./TripObjectionHandling";
import { AboutCavingCrew } from "./AboutCavingCrew";
import { useUser } from "../../lib/hooks/useUser";
import { Auth } from "../../utils/user-utils";
import { useTripParticipants } from "../../lib/hooks/useTripParticipants";

/**
 * Component to display trip enjoyment rating and duration
 */
function TripEnjoymentRating({
	starRating,
	estimatedTime,
	isPastTrip = false, // Add isPastTrip prop
}: {
	starRating?: string | number;
	estimatedTime?: string;
	isPastTrip?: boolean; // Make prop optional
}) {
	if (!starRating && !estimatedTime) return null;

	return (
    <Stack gap="md" align="flex-start">
      {starRating && (
        <Box>
          <Text fw={500} mb="xs">
            Wowfactor
          </Text>
          <Group>
            {/* Custom star rendering to show only the exact number of stars */}
            {[...Array(typeof starRating === 'string' ?
              parseInt(starRating, 10) :
              (typeof starRating === 'number' ? starRating : 0)
            )].map((_, index) => (
              <IconStar
                key={index}
                size={28}
                style={{ color: '#FFD700', fill: '#FFD700' }}
              />
            ))}
          </Group>
        </Box>
      )}
      {estimatedTime && (
        <Box>
          <Group gap="xs" align="flex-start">
            <IconClock size={18} style={{ marginTop: 4 }} />
            <div>
              <Text>
                Estimated Duration:{" "}
                {parseFloat(estimatedTime) + parseFloat(estimatedTime) * 0.25}{" "}
                hours
              </Text>
              <Text size="sm" c="dimmed" mt={5} style={{ maxWidth: "500px" }}>
                {isPastTrip
                  ? "Note: This is a vague estimate and probably isn't a good reflection of how long the team were actually underground on this occasion."
                  : "Note: Cave trip durations vary widely based on group experience, preparation time, navigation, and rest breaks."}
              </Text>
            </div>
          </Group>
        </Box>
      )}
    </Stack>
  );
}

interface TripExperienceProps {
	trip: Trip;
	isPastTrip?: boolean; // Add the new prop
}

export function TripExperience({ trip, isPastTrip = false }: TripExperienceProps) {
	const { user } = useUser();
	const isLoggedIn = Auth.isLoggedIn(user);
	const { data } = useTripParticipants(trip.id);
	const routeData = trip.route?.acf;
	const participantSkills = routeData?.route_participants_skills_required;
	const leadingDifficulty = routeData?.route_leading_difficulty;
	const groupTackle = routeData?.route_group_tackle_required;
	const personalGear = routeData?.route_personal_gear_required;
	const starRating = routeData?.route_trip_star_rating;
	const estimatedTime = routeData?.route_time_for_eta;

	const challengeResult = extractChallengeMetrics(routeData);
	const challengeMetrics = challengeResult?.metrics;
	const weightedRank = challengeResult?.weightedRank;
	
	// Check if location has sensitive access
	const isSensitiveAccess = trip.route?.acf?.route_entrance_location_id?.acf?.location_sensitive_access;

	// Check if we have enough data to show the trip experience section
	const hasExperienceData =
		// First check if we have a valid route with meaningful data
		routeData &&
		trip.route?.id !== null &&
		trip.route?.title !== "Cave Entrance Details" &&
		// Then check if any of these specific fields have actual content
		(
			(starRating && starRating > 0) ||
			(estimatedTime && estimatedTime.trim() !== '') ||
			(routeData.route_blurb && routeData.route_blurb.trim() !== '') ||
			(challengeMetrics && challengeMetrics.length > 0)
		);

	return (
		<>
			<SensitiveAccessWarning isVisible={!!isSensitiveAccess} />
		
			{hasExperienceData && (
				<Paper withBorder p="md" radius="md" mt="md">
					<Title order={2} mb="md">
						{/* Update title based on prop */}
						{isPastTrip ? "What the Trip Was Like" : "What the Trip Will Be Like"}
					</Title>

					<Grid gutter="md" mb="xl">
						<Grid.Col span={{ base: 12, md: 6 }}>
							{/* Trip Enjoyment Rating */}
							{(starRating || estimatedTime) && (
								<TripEnjoymentRating
									starRating={starRating}
									estimatedTime={estimatedTime}
									isPastTrip={isPastTrip} // Pass prop down
								/>
							)}

							{/* Trip Overview */}
							{routeData?.route_blurb && (
								<Stack gap="md" mt="xl">
									{/* Content from WordPress sanitized HTML */}
									<div
										dangerouslySetInnerHTML={{ __html: routeData.route_blurb }}
									/>
								</Stack>
							)}
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 6 }}>
							{challengeMetrics && (
								<TripChallengeIndicator
									metrics={challengeMetrics}
									weightedRank={weightedRank}
								/>
							)}
						</Grid.Col>
					</Grid>


				{/* Participant Experience - Enhanced */}
				<Stack gap="md" mb="xl">
					{/* Conditionally show title */}
					{!isPastTrip && participantSkills && (
						<Group gap="xs">
							<ThemeIcon variant="light" color="teal">
								<IconUser size={18} />
							</ThemeIcon>
							<Text fw={500}>Suggested Experience</Text>
						</Group>
					)}

					{/* Conditionally show specific skill level */}
					{!isPastTrip &&
						participantSkills?.route_participants_skills_required_horizontal_level ? (
							<Box>
								<Group align="center" mb="xs">
									<Badge size="lg" color="teal" variant="filled">
										Suggested Skill Level:{" "}
										{typeof participantSkills.route_participants_skills_required_horizontal_level ===
										"object"
											? (
													participantSkills.route_participants_skills_required_horizontal_level as any
												)?.post_title
											: participantSkills.route_participants_skills_required_horizontal_level}
									</Badge>

									{typeof participantSkills.route_participants_skills_required_horizontal_level ===
										"object" &&
										(
											participantSkills.route_participants_skills_required_horizontal_level as {
												permalink: string;
											}
										)?.permalink && (
											<Anchor
												href={
													(
														participantSkills.route_participants_skills_required_horizontal_level as {
															permalink: string;
														}
													).permalink
												}
												target="_blank"
												size="sm"
											>
												View Syllabus
											</Anchor>
										)}
								</Group>

								{typeof participantSkills.route_participants_skills_required_horizontal_level ===
									"object" &&
									(
										participantSkills.route_participants_skills_required_horizontal_level as any
									)?.post_title === "Horizontal Basic" && (
										<Alert color="teal" icon={<IconCompass size={18} />} mb="md">
											<Text size="sm">
												<strong>Horizontal Basic</strong> means you should be
												comfortable with:
												<List size="sm" mt="xs">
													<List.Item>
														Moving through basic cave passages
													</List.Item>
													<List.Item>Climbing short, simple climbs</List.Item>
													<List.Item>Basic crawling and stooping</List.Item>
													<List.Item>
														Following instructions from leaders and being supportive around other cavers
													</List.Item>
												</List>
											</Text>
										</Alert>
									)}
							</Box>
						) : participantSkills && (
							<Box>
								<Alert color="teal" icon={<IconCompass size={18} />} mb="md">
									<Text size="sm">
										<strong>We hope you might:</strong>
										<List size="sm" mt="xs">
											<List.Item>Be able to walk up two flights of stairs unaided</List.Item>
											<List.Item>Be able to bend down and kneel up</List.Item>
											<List.Item>Be able to laugh</List.Item>
											<List.Item>Be willing to support other people in the group</List.Item>
										</List>
									</Text>
								</Alert>
							</Box>
						)}

						{participantSkills?.minimum_experience && (
							<Text>
								<strong>Minimum Experience:</strong>{" "}
								{participantSkills.minimum_experience}
							</Text>
						)}

						{participantSkills?.recommended_training &&
							participantSkills.recommended_training.length > 0 && (
								<div>
									<Text fw={500}>Recommended Training:</Text>
									<List>
										{participantSkills.recommended_training.map((training, i) => (
											<List.Item
												key={`training-${training.substring(0, 10)}-${i}`}
											>
												{training}
											</List.Item>
										))}
									</List>
								</div>
							)}

						{/* Conservation Alert - Hide if past trip */}
						{hasExperienceData && !isPastTrip && (
							<Alert
								color="green"
								title="Conservation Notice"
								icon={<IconFirstAidKit size={18} />}
								mb="md"
							>
								<Text size="sm">
									Please follow all conservation guidelines and avoid touching
									formations or removing any historical relics. Take nothing but pictures, leave nothing but footprints.
								</Text>
							</Alert>
						)}
					</Stack>
				</Paper>
			)}

			{/* Objection Handling for GiggleTrips - only shown to non-logged in users */}
			{trip.acf?.event_type === 'giggletrip' && !isLoggedIn && (
				<>
					<TripObjectionHandling />
					<AboutCavingCrew />
				</>
			)}

			{/* Equipment Section - Hide if past trip */}
			{!isPastTrip &&
				((Array.isArray(personalGear) && personalGear.length > 0) ||
					groupTackle) && (
					<Paper withBorder p="md" radius="md" mt="md">
						<Title order={2} mb="md">
							Equipment
					</Title>

					{/* Personal Equipment Suggested */}
					{Array.isArray(personalGear) && personalGear.length > 0 && (
						<Stack gap="md" mb="xl">
							<Group gap="xs">
								<ThemeIcon variant="light" color="blue">
									<IconShirt size={18} />
								</ThemeIcon>
								<Text fw={500}>Suggested Personal Equipment</Text>
							</Group>

							<Grid>
								{Array.isArray(personalGear) &&
									personalGear.map((item, index) => (
										<Grid.Col span={{ base: 6, md: 4 }} key={`gear-${index}`}>
											<Group gap="xs">
												{(() => {
													// Choose icon based on gear type
													switch (item.toLowerCase()) {
														case "oversuit":
															return <IconShirt size={16} />;
														case "undersuit":
															return <IconShirt size={16} />;
														case "wellies":
															return <IconShoe size={16} />; // Boot icon
														case "kneepads":
															return <IconFirstAidKit size={16} />; // Medical icon for protection
														case "helmet and light":
															return <IconBolt size={16} />; // Light/helmet icon
														case "gloves":
															return <IconThumbUp size={16} />; // Hand/glove icon
														case "belt":
															return <IconMountain size={16} />; // Harness-like icon
														default:
															return <IconTool size={16} />;
													}
												})()}
												<Text>{item}</Text>
											</Group>
										</Grid.Col>
									))}
							</Grid>

							<Alert color="blue" icon={<IconInfoCircle size={16} />}>
								<Text size="sm">
									{trip.acf.event_gear_required === 'Horizontal Caving Gear and SRT Kit' ||
									(Array.isArray(personalGear) && personalGear.length > 0 &&
										trip.acf.event_gear_required !== 'None') ? (
										<>
											<strong>Important:</strong> This trip requires you bring your own gear. The Crew can't offer you gear for this trip - usually because its already in use.
										</>
									) : (
										<>
											Don't have any of the gear? The Crew has all equipment available to
											borrow - just let us know what you already have after you sign up.
										</>
									)}
								</Text>
							</Alert>

						</Stack>
					)}

					{/* Group Equipment */}
					{groupTackle && (
						<Stack gap="md" mb="xl">
							<Group gap="xs">
								<ThemeIcon variant="light" color="grape">
									<IconTool size={18} />
								</ThemeIcon>
								<Text fw={500}>Suggested Group Equipment</Text>
							</Group>

							{/* If groupTackle is a string with line breaks, convert to list */}
							{typeof groupTackle === "string" &&
							groupTackle.indexOf("\r\n") !== -1 ? (
								<List>
									{groupTackle
										.split("\r\n")
										.filter((line) => line.trim())
										.map((line, index) => (
											<List.Item key={`tackle-${index}`}>
												{line.replace(/^-\s*/, "")}
											</List.Item>
										))}
								</List>
							) : (
								<div dangerouslySetInnerHTML={{ __html: groupTackle }} />
							)}

							<Alert color="violet" icon={<IconInfoCircle size={16} />}>
								<Text size="sm">
									The trip leader will organize this equipment. You don't need to
									bring these items unless specifically asked.
								</Text>
							</Alert>
						</Stack>
					)}
				</Paper>
			)}

		</>
	);
}
