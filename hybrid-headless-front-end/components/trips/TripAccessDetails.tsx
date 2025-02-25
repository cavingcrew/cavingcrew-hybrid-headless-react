"use client";

import {
	Alert,
	Button,
	Divider,
	Group,
	List,
	Paper,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from "@mantine/core";
import {
	IconInfoCircle,
	IconKey,
	IconMapPin,
	IconParking,
	IconWalk,
} from "@tabler/icons-react";
import React from "react";
import type { Trip } from "../../types/api";

interface TripAccessDetailsProps {
	trip: Trip;
}

export function TripAccessDetails({ trip }: TripAccessDetailsProps) {
	const locationData = trip.acf.route?.acf.route_entrance_location_id?.acf;
	const accessNotes = locationData?.location_access_arrangement || [];
	const parkingInstructions = locationData?.location_parking_instructions;
	const entranceLatLong = locationData?.location_entrance_latlong;
	const parkingLatLong = locationData?.location_parking_latlong;

	console.log("[TripAccessDetails] Rendering with trip data:", {
		route: trip.acf.route,
		locationData: trip.acf.route?.acf.route_entrance_location_id?.acf,
		accessNotes,
		parkingInstructions,
		entranceLatLong,
		parkingLatLong,
	});

	return (
		<Paper
			withBorder
			p="md"
			radius="md"
			mt="md"
			style={{ border: "2px solid red" }}
		>
			{!locationData && (
				<Alert color="yellow" mb="md">
					No access details available for this trip
				</Alert>
			)}
			<Title order={2} mb="md">
				Your Trip Access Details
			</Title>

			<Stack gap="md">
				{/* Parking Section */}
				{parkingLatLong && (
					<div>
						<Group gap="xs" mb="sm">
							<ThemeIcon variant="light" color="blue" size="lg">
								<IconParking size={18} />
							</ThemeIcon>
							<Text fw={500}>Parking Location</Text>
						</Group>

						{parkingInstructions && (
							<Text mb="sm" c="dimmed">
								{parkingInstructions}
							</Text>
						)}

						<Button
							component="a"
							href={`http://maps.apple.com/?address=${parkingLatLong}`}
							target="_blank"
							leftSection={<IconMapPin size={16} />}
							variant="outline"
						>
							Open Parking in Maps
						</Button>
					</div>
				)}

				{/* Cave Entrance Section */}
				{entranceLatLong && (
					<div>
						<Group gap="xs" mb="sm">
							<ThemeIcon variant="light" color="orange" size="lg">
								<IconWalk size={18} />
							</ThemeIcon>
							<Text fw={500}>Cave Entrance</Text>
						</Group>

						<Button
							component="a"
							href={`http://maps.apple.com/?address=${entranceLatLong}`}
							target="_blank"
							leftSection={<IconMapPin size={16} />}
							variant="outline"
						>
							Open Cave Entrance in Maps
						</Button>
					</div>
				)}

				{/* Access Requirements */}
				{accessNotes.length > 0 && (
					<div>
						<Group gap="xs" mb="sm">
							<ThemeIcon variant="light" color="violet" size="lg">
								<IconKey size={18} />
							</ThemeIcon>
							<Text fw={500}>Access Requirements</Text>
						</Group>

						<List spacing="sm">
							{accessNotes.map((note, index) => (
								<List.Item
									key={index}
									icon={
										<IconInfoCircle
											size={16}
											color="var(--mantine-color-gray-6)"
										/>
									}
								>
									{note}
								</List.Item>
							))}
						</List>
					</div>
				)}

				{/* Route Description */}
				{trip.acf.route?.acf.route_blurb && (
					<Alert variant="light" color="yellow" icon={<IconInfoCircle />}>
						<div
							dangerouslySetInnerHTML={{
								__html: trip.acf.route.acf.route_blurb,
							}}
						/>
					</Alert>
				)}
			</Stack>

			{trip.acf.route?.acf.route_route_description
				?.route_description_segment_html && (
				<>
					<Divider my="md" />
					<Title order={3} mb="sm">
						Route Description
					</Title>
					<div
						dangerouslySetInnerHTML={{
							__html:
								trip.acf.route.acf.route_route_description
									.route_description_segment_html,
						}}
					/>
				</>
			)}
		</Paper>
	);
}
