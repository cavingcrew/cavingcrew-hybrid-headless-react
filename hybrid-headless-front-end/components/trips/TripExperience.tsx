"use client";

import {
	Alert,
	Group,
	List,
	Paper,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from "@mantine/core";
import {
	IconCompass,
	IconFirstAidKit,
	IconMountain,
	IconTool,
	IconUser,
} from "@tabler/icons-react";
import React from "react";
import type { Trip } from "../../types/api";

interface TripExperienceProps {
	trip: Trip;
}

export function TripExperience({ trip }: TripExperienceProps) {
	const routeData = trip.route?.acf;
	const participantSkills = routeData?.route_participants_skills_required;
	const leadingDifficulty = routeData?.route_leading_difficulty;
	const groupTackle = routeData?.route_group_tackle_required;

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
					<div dangerouslySetInnerHTML={{ __html: routeData.route_blurb }} />
				</Stack>
			)}

			{/* Participant Experience */}
			{participantSkills && (
				<Stack gap="md" mb="xl">
					<Group gap="xs">
						<ThemeIcon variant="light" color="teal">
							<IconUser size={18} />
						</ThemeIcon>
						<Text fw={500}>Participant Experience</Text>
					</Group>

					{participantSkills?.route_participants_skills_required_horizontal_level && (
						<Text>
							<strong>Horizontal Skills:</strong>{" "}
							{typeof participantSkills.route_participants_skills_required_horizontal_level ===
							"object"
								? (
										participantSkills.route_participants_skills_required_horizontal_level as {
											post_title: string;
										}
									)?.post_title
								: participantSkills.route_participants_skills_required_horizontal_level}
						</Text>
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
										<List.Item key={i}>{training}</List.Item>
									))}
								</List>
							</div>
						)}
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
						<Text>
							<strong>Required Leadership Level:</strong>{" "}
							{
								leadingDifficulty
									.route_leading_difficulty_horizontal_leading_level_required
									.post_title
							}
						</Text>
					)}

					{leadingDifficulty
						.route_leading_difficulty_horizontal_leading_skills_required
						?.length > 0 && (
						<div>
							<Text fw={500}>Essential Leadership Skills:</Text>
							<List>
								{leadingDifficulty.route_leading_difficulty_horizontal_leading_skills_required.map(
									(skill, i) => (
										<List.Item key={i}>{skill}</List.Item>
									),
								)}
							</List>
						</div>
					)}

					{leadingDifficulty.route_leading_difficulty_navigation_difficulty && (
						<Text>
							<strong>Navigation Difficulty:</strong>{" "}
							{leadingDifficulty.route_leading_difficulty_navigation_difficulty}
						</Text>
					)}
				</Stack>
			)}

			{/* Group Equipment */}
			{groupTackle && (
				<Stack gap="md" mb="xl">
					<Group gap="xs">
						<ThemeIcon variant="light" color="grape">
							<IconTool size={18} />
						</ThemeIcon>
						<Text fw={500}>Group Equipment Required</Text>
					</Group>
					<div dangerouslySetInnerHTML={{ __html: groupTackle }} />
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
					This cave is part of the Masson Hill SSSI. Please follow all
					conservation guidelines and avoid touching formations.
				</Text>
			</Alert>

			{/* Parking Warning */}
			<Alert
				color="red"
				title="Parking Advisory"
				icon={<IconMountain size={18} />}
				mb="md"
			>
				<Text size="sm">
					Parking is extremely limited - carpooling strongly recommended. Never
					block farm access tracks. Recent reports of vehicle damage - park
					considerately!
				</Text>
			</Alert>
		</Paper>
	);
}
