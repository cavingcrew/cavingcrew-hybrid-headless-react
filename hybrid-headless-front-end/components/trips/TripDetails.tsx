"use client";

import {
	Accordion,
	Badge,
	Button,
	Container,
	Grid,
	Group,
	Image,
	List,
	Paper,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import {
	IconCalendar,
	IconClock,
	IconCoin,
	IconMapPin,
} from "@tabler/icons-react";
import React from "react";
import type { Trip } from "../../types/api";

interface TripDetailsProps {
	trip: Trip;
}

export function TripDetails({ trip }: TripDetailsProps) {
	const acf = trip.acf;

	const startDate = acf?.event_start_date_time
		? new Date(acf.event_start_date_time)
		: null;

	return (
		<Stack gap="xl">
			{/* Header Section */}
			<Stack gap="md">
				<Title order={1}>{trip.name}</Title>
				{acf?.event_description && <Text>{acf.event_description}</Text>}
			</Stack>

			{/* Key Details Section */}
			<Grid>
				<Grid.Col span={{ base: 12, md: 8 }}>
					<Paper withBorder p="md" radius="md">
						<Stack gap="md">
							{startDate && (
								<Group gap="xs">
									<IconCalendar size={20} />
									<Text>
										When:{" "}
										{startDate.toLocaleDateString("en-GB", {
											weekday: "long",
											day: "numeric",
											month: "long",
										})}
									</Text>
								</Group>
							)}
							{startDate && (
								<Group gap="xs">
									<IconClock size={20} />
									<Text>
										Time: from{" "}
										{startDate.toLocaleTimeString("en-GB", {
											hour: "2-digit",
											minute: "2-digit",
										})}
									</Text>
								</Group>
							)}
							{acf?.event_location && (
								<Group gap="xs">
									<IconMapPin size={20} />
									<Text>
										Location: {acf.event_cave_name || ""} near{" "}
										{acf.event_possible_location || ""}
									</Text>
								</Group>
							)}
							<Group gap="xs">
								<IconCoin size={20} />
								<Text>Member Price: £{acf?.event_cost || trip.price}</Text>
							</Group>
							<Group gap="xs">
								<IconCoin size={20} />
								<Text>Non-Member Price: £{trip.price}</Text>
							</Group>
						</Stack>
					</Paper>

					{/* Requirements Section */}
					{(acf?.event_skills_required || acf?.event_gear_required) && (
						<Paper withBorder p="md" radius="md" mt="md">
							<Stack gap="md">
								<Text fw={500}>Requirements</Text>
								{acf?.event_skills_required && (
									<div>
										<Text size="sm" fw={500}>
											Minimum Skills
										</Text>
										<Text>{acf.event_skills_required}</Text>
									</div>
								)}
								{acf?.event_gear_required && (
									<div>
										<Text size="sm" fw={500}>
											Minimum Gear
										</Text>
										<Text>{acf.event_gear_required}</Text>
									</div>
								)}
							</Stack>
						</Paper>
					)}
				</Grid.Col>

				<Grid.Col span={{ base: 12, md: 4 }}>
					{trip.images?.[0] && (
						<Image
							src={trip.images[0].src}
							alt={trip.images[0].alt}
							radius="md"
						/>
					)}
				</Grid.Col>
			</Grid>

			{/* What does signing up pay for section */}
			{acf?.event_paying_for && (
				<Paper withBorder p="md" radius="md">
					<Title order={2} mb="md">
						What does signing up pay for?
					</Title>
					<Text>{trip.acf.event_paying_for}</Text>
				</Paper>
			)}

			{/* FAQ Section */}
			{acf.trip_faq && acf.trip_faq.length > 0 && (
				<Paper withBorder p="md" radius="md">
					<Title order={2} mb="md">
						Q&A
					</Title>
					<Accordion>
						{acf.trip_faq &&
							Array.isArray(acf.trip_faq) &&
							acf.trip_faq.map((faq) => (
								<Accordion.Item
									key={faq.trip_faq_title}
									value={faq.trip_faq_title}
								>
									<Accordion.Control>{faq.trip_faq_title}</Accordion.Control>
									<Accordion.Panel>
										{faq.trip_faq_answer && <Text>{faq.trip_faq_answer}</Text>}
									</Accordion.Panel>
								</Accordion.Item>
							))}
					</Accordion>
				</Paper>
			)}

			{/* Kit List Section */}
			{acf.overnight_kitlist && acf.overnight_kitlist.length > 0 && (
				<Paper withBorder p="md" radius="md">
					<Title order={2} mb="md">
						Kit List
					</Title>
					<Accordion>
						{acf.overnight_kitlist &&
							Array.isArray(acf.overnight_kitlist) &&
							acf.overnight_kitlist.map((kit) => (
								<Accordion.Item
									key={kit.overnight_kit_list_type}
									value={kit.overnight_kit_list_type}
								>
									<Accordion.Control>
										{kit.overnight_kit_list_type}
									</Accordion.Control>
									<Accordion.Panel>
										{kit.overnight_kit_list && (
											<Text>{kit.overnight_kit_list}</Text>
										)}
									</Accordion.Panel>
								</Accordion.Item>
							))}
					</Accordion>
				</Paper>
			)}

			{/* Plans Section */}
			{acf.overnight_plans && acf.overnight_plans.length > 0 && (
				<Paper withBorder p="md" radius="md">
					<Title order={2} mb="md">
						Plans
					</Title>
					<Text mb="md">
						Times are all subject to change, and are mainly for illustration and
						to start conversation.
					</Text>
					<Accordion>
						{acf.overnight_plans &&
							Array.isArray(acf.overnight_plans) &&
							acf.overnight_plans.map((plan) => (
								<Accordion.Item
									key={plan.overnight_plans_day}
									value={plan.overnight_plans_day}
								>
									<Accordion.Control>
										{plan.overnight_plans_day}
									</Accordion.Control>
									<Accordion.Panel>
										{plan.overnight_plans_description && (
											<Text>{plan.overnight_plans_description}</Text>
										)}
									</Accordion.Panel>
								</Accordion.Item>
							))}
					</Accordion>
				</Paper>
			)}
		</Stack>
	);
}
