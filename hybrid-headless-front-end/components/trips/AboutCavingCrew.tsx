"use client";

import {
	Box,
	Button,
	Center,
	Group,
	List,
	Paper,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from "@mantine/core";
import {
	IconCalendarEvent,
	IconCertificate,
	IconHeartHandshake,
	IconMountain,
	IconUsers,
} from "@tabler/icons-react";
import React from "react";

export function AboutCavingCrew() {
	return (
		<Paper withBorder p="md" radius="md" mt="md">
			<Title order={2} mb="md">
				About The Caving Crew
			</Title>

			<Stack gap="md">
				<Text>
					We're a friendly, inclusive caving club founded by mother-son team
					Judith (70s) and Tim (30s) dedicated to making underground exploration
					accessible to everyone, regardless of age or experience.
				</Text>

				<Text>
					Our beginner trips feature spacious caves, all necessary equipment,
					and experienced guides who prioritize safety and enjoyment. We
					maintain strict leader-to-newbie ratios and follow British Caving
					Association best practices.
				</Text>

				<Box mt="sm">
					<Text fw={500} mb="xs">
						We offer:
					</Text>
					<List
						spacing="xs"
						size="sm"
						center
						icon={
							<ThemeIcon color="blue" size={24} radius="xl">
								<IconCalendarEvent size={16} />
							</ThemeIcon>
						}
					>
						<List.Item>Monthly beginner-friendly trips</List.Item>
						<List.Item>Regular weekday and weekend adventures</List.Item>
						<List.Item>Professional training sessions</List.Item>
						<List.Item>Joint events with The Climbing Clan</List.Item>
					</List>
				</Box>

				<Group gap="xs" mt="sm">
					<ThemeIcon variant="light" color="blue">
						<IconUsers size={18} />
					</ThemeIcon>
					<Text>
						From 18 to 70+, our diverse members find adventure, friendship, and
						unexpected confidence in our supportive community.
					</Text>
				</Group>

				<Group gap="xs">
					<ThemeIcon variant="light" color="green">
						<IconCertificate size={18} />
					</ThemeIcon>
					<Text fw={500}>
						All equipment provided. No experience necessary. Just bring your
						curiosity!
					</Text>
				</Group>
			</Stack>

			<Center mt="xl">
				<Button
					size="lg"
					color="blue"
					onClick={() => {
						const signupSection = document.getElementById(
							"trip-signup-section",
						);
						if (signupSection) {
							signupSection.scrollIntoView({ behavior: "smooth" });
						}
					}}
				>
					Join Our Caving Community - Sign Up Now
				</Button>
			</Center>
		</Paper>
	);
}
