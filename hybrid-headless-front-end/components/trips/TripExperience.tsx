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
} from "@tabler/icons-react";
import React from "react";
import type { Trip } from "../../types/api";
import { extractChallengeMetrics } from "../../utils/difficulty-utils";
import { TripChallengeIndicator } from "./TripChallengeIndicator";
import { useUser } from "@/lib/hooks/useUser";

/**
 * Component to display trip enjoyment rating and duration
 */
function TripEnjoymentRating({
  starRating,
  estimatedTime
}: {
  starRating?: string | number;
  estimatedTime?: string;
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
            {Array.from({ length: typeof starRating === 'string' ?
              Number.parseInt(starRating, 10) :
              (typeof starRating === 'number' ? starRating : 0)
            }).map((_, index) => (
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
              <Text>Estimated Duration: {parseFloat(estimatedTime) + (parseFloat(estimatedTime) * 0.25)} hours</Text>
              <Text size="sm" c="dimmed" mt={5} style={{ maxWidth: '500px' }}>
                Note: Cave trip durations vary widely based on group experience, preparation time, navigation, and rest breaks.
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
}

export function TripExperience({ trip }: TripExperienceProps) {
	const { isLoggedIn } = useUser();
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

	return (
		<>
			<Paper withBorder p="md" radius="md" mt="md">
				<Title order={2} mb="md">
					What the Trip Will Be Like
				</Title>

				<Grid gutter="md" mb="xl">
					<Grid.Col span={{ base: 12, md: 6 }}>
						{/* Trip Enjoyment Rating */}
						{(starRating || estimatedTime) && (
							<TripEnjoymentRating
								starRating={starRating}
								estimatedTime={estimatedTime}
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
						{participantSkills && (
							<Group gap="xs">
								<ThemeIcon variant="light" color="teal">
									<IconUser size={18} />
								</ThemeIcon>
								<Text fw={500}>Suggested Experience</Text>
							</Group>
						)}

						{participantSkills?.route_participants_skills_required_horizontal_level ? (
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

						{/* Conservation Alert */}
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
					</Stack>
			</Paper>

			{/* Equipment Section in its own Paper container */}
			{((Array.isArray(personalGear) && personalGear.length > 0) || groupTackle) && (
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
															return <IconWalk size={16} />;
														case "kneepads":
															return <IconArrowsVertical size={16} />;
														case "helmet and light":
															return <IconFirstAidKit size={16} />;
														case "gloves":
															return <IconTool size={16} />;
														case "belt":
															return <IconRuler size={16} />;
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
									Don't have any of the gear? The Crew has all equipment available to
									borrow - just let us know what you need after you sign up.
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

			{/* Leading the Trip - Separate Paper Container - Only visible to logged in users */}
			{leadingDifficulty && isLoggedIn && (
				<Paper withBorder p="md" radius="md" mt="md">
					<Stack gap="md" mb="xl">
						<Group gap="xs">
							<ThemeIcon variant="light" color="orange">
								<IconMountain size={18} />
							</ThemeIcon>
							<Text fw={500}>Leading This Trip</Text>
						</Group>
						{leadingDifficulty.route_leading_difficulty_navigation_difficulty && (
							<Group mt="md">
								<Text fw={500}>Navigation Difficulty:</Text>
								<Badge
									size="lg"
									color={
										Number.parseInt(
											leadingDifficulty.route_leading_difficulty_navigation_difficulty,
											10
										) <= 2.5
											? "green"
											: Number.parseInt(
												leadingDifficulty.route_leading_difficulty_navigation_difficulty,
												10
											) <= 6.5
												? "yellow"
												: "red"
									}
								>
									{
										leadingDifficulty.route_leading_difficulty_navigation_difficulty
									}
									/10
								</Badge>
							</Group>
						)}
						{leadingDifficulty.route_leading_difficulty_horizontal_leading_level_required && (
							<Group align="center" mb="xs">
								<Badge size="lg" color="orange" variant="filled">
									Suggested Leading Level:{" "}
									{
										leadingDifficulty
											.route_leading_difficulty_horizontal_leading_level_required
											.post_title
									}
								</Badge>

								{leadingDifficulty
									.route_leading_difficulty_horizontal_leading_level_required
									.permalink && (
									<Anchor
										href={
											leadingDifficulty
												.route_leading_difficulty_horizontal_leading_level_required
												.permalink
										}
										target="_blank"
										size="sm"
									>
										View Leading Level
									</Anchor>
								)}
							</Group>
						)}

						{leadingDifficulty.route_leading_difficulty_horizontal_leading_skills_required &&
							leadingDifficulty
								.route_leading_difficulty_horizontal_leading_skills_required
								.length > 0 && (
								<div>
									<Text fw={500}>Suggested Leading Skills:</Text>
									<List>
										{leadingDifficulty.route_leading_difficulty_horizontal_leading_skills_required.map(
											(skill, i) => (
												<List.Item
													key={`skill-${skill.substring(0, 10)}-${i}`}
													icon={
														<ThemeIcon color="orange" size={24} radius="xl">
															<IconStar size={16} />
														</ThemeIcon>
													}
												>
													{skill}
												</List.Item>
											),
										)}
									</List>
								</div>
							)}


					</Stack>

				</Paper>
			)}
		</>
	);
}
