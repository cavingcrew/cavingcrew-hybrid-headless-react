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
} from "@tabler/icons-react";
import React from "react";
import type { Trip } from "../../types/api";
import { TripChallengeMetrics } from "./TripChallengeMetrics";

interface TripExperienceProps {
	trip: Trip;
}

export function TripExperience({ trip }: TripExperienceProps) {
	const routeData = trip.route?.acf;
	const participantSkills = routeData?.route_participants_skills_required;
	const leadingDifficulty = routeData?.route_leading_difficulty;
	const groupTackle = routeData?.route_group_tackle_required;
	const personalGear = routeData?.route_personal_gear_required;

	return (
		<Paper withBorder p="md" radius="md" mt="md">
			<Title order={2} mb="md">
				What the Trip Will Be Like
			</Title>

			{/* Trip Overview */}
			{routeData?.route_blurb && (
				<Stack gap="md" mb="xl">
					<Group gap="xs">
						<ThemeIcon variant="light" color="blue">
							<IconCompass size={18} />
						</ThemeIcon>
						<Text fw={500}>Cave Overview</Text>
					</Group>
					{/* Content from WordPress sanitized HTML */}
					<div
						dangerouslySetInnerHTML={{ __html: routeData.route_blurb }}
					/>
				</Stack>
			)}

			{/* Challenge and Enjoyment Metrics */}
			<TripChallengeMetrics trip={trip} />

			{/* Participant Experience - Enhanced */}
			{participantSkills && (
				<Stack gap="md" mb="xl">
					<Group gap="xs">
						<ThemeIcon variant="light" color="teal">
							<IconUser size={18} />
						</ThemeIcon>
						<Text fw={500}>Participant Experience</Text>
					</Group>

					{participantSkills?.route_participants_skills_required_horizontal_level && (
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
													Following instructions from leaders
												</List.Item>
											</List>
										</Text>
									</Alert>
								)}
						</Box>
					)}

					{participantSkills.minimum_experience && (
						<Text>
							<strong>Minimum Experience:</strong>{" "}
							{participantSkills.minimum_experience}
						</Text>
					)}

					{participantSkills.recommended_training &&
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
				</Stack>
			)}

			{/* Personal Equipment Suggested */}
			{personalGear && personalGear.length > 0 && (
				<Stack gap="md" mb="xl">
					<Group gap="xs">
						<ThemeIcon variant="light" color="blue">
							<IconShirt size={18} />
						</ThemeIcon>
						<Text fw={500}>Personal Equipment Suggested</Text>
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
							Don't have all the gear? The club has equipment available to
							borrow - just let us know what you need when you sign up.
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
						<Text fw={500}>Group Equipment Suggested</Text>
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

			{/* Leading the Trip */}
			{leadingDifficulty && (
				<Stack gap="md" mb="xl">
					<Group gap="xs">
						<ThemeIcon variant="light" color="orange">
							<IconMountain size={18} />
						</ThemeIcon>
						<Text fw={500}>Leading This Trip</Text>
					</Group>

					{leadingDifficulty.route_leading_difficulty_horizontal_leading_level_required && (
						<Group align="center" mb="xs">
							<Badge size="lg" color="orange" variant="filled">
								Suggested Leadership Level:{" "}
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
									View Leadership Requirements
								</Anchor>
							)}
						</Group>
					)}

					{leadingDifficulty.route_leading_difficulty_horizontal_leading_skills_required &&
						leadingDifficulty
							.route_leading_difficulty_horizontal_leading_skills_required
							.length > 0 && (
							<div>
								<Text fw={500}>Essential Leadership Skills:</Text>
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

					{leadingDifficulty.route_leading_difficulty_navigation_difficulty && (
						<Group mt="md">
							<Text fw={500}>Navigation Difficulty:</Text>
							<Badge
								size="lg"
								color={
									Number.parseInt(
										leadingDifficulty.route_leading_difficulty_navigation_difficulty,
										10,
									) <= 2
										? "green"
										: Number.parseInt(
													leadingDifficulty.route_leading_difficulty_navigation_difficulty,
													10,
												) <= 3
											? "yellow"
											: "red"
								}
							>
								{
									leadingDifficulty.route_leading_difficulty_navigation_difficulty
								}
								/5
							</Badge>
						</Group>
					)}
				</Stack>
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
					formations. Take nothing but pictures, leave nothing but footprints.
				</Text>
			</Alert>
		</Paper>
	);
}
