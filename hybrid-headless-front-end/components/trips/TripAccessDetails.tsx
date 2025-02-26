"use client";

import {
	Alert,
	Button,
	Divider,
	Group,
	Image,
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
	const locationData = trip.route?.acf.route_entrance_location_id?.acf;
	const accessNotes = locationData?.location_access_arrangement
		? typeof locationData.location_access_arrangement === "string"
			? JSON.parse(locationData.location_access_arrangement)
			: locationData.location_access_arrangement
		: [];

	// New route description data
	const routeDescription = trip.route?.acf.route_route_description;
	const hasRouteDescription =
		routeDescription &&
		(typeof routeDescription === "object" || Array.isArray(routeDescription));
	const parkingInstructions = locationData?.location_parking_description;
	const entranceCoords = locationData?.location_entrance_latlong;
	const parkingCoords = locationData?.location_parking_latlong;
	const parkingToEntranceRoute =
		locationData?.location_parking_entrance_route_description;
	const referenceLinks = locationData?.location_reference_links;
	const mapImage = locationData?.location_map_from_parking_to_entrance;
	const accessUrl = locationData?.location_access_url;
	const infoUrl = locationData?.location_info_url;
	const isSensitiveAccess = locationData?.location_sensitive_access;

	// Coordinate parsing logic
	const parseCoords = (
		coords: string | { lat?: number; lng?: number } | null | undefined,
	) => {
		if (!coords) return null;
		if (typeof coords === "string") return coords;
		if (coords.lat && coords.lng) return `${coords.lat},${coords.lng}`;
		return null;
	};

	const parkingLatLong = parseCoords(parkingCoords);
	const entranceLatLong = parseCoords(entranceCoords);

	return (
		<Paper withBorder p="md" radius="md" mt="md">
			<Title order={2} mb="md">
				Cave Access Details
			</Title>
			{/* Updated Sensitive Access Warning */}
			{isSensitiveAccess && (
				<Alert
					color="red"
					icon={<IconInfoCircle size={16} />}
					mb="xl"
					title="Sensitive Access Location"
				>
					<Text size="sm">
						This location has sensitive access arrangements. Please:
					</Text>
					<List size="sm" mt={4}>
						<List.Item>Follow all access guidelines carefully</List.Item>
						<List.Item>Do not share exact location details publicly</List.Item>
						<List.Item>Avoid naming the location on social media</List.Item>
					</List>
				</Alert>
			)}

			{/* Parking Section */}
			{parkingLatLong && (
				<Stack gap="sm" mb="xl">
					<Group gap="xs">
						<ThemeIcon variant="light" color="blue">
							<IconParking size={18} />
						</ThemeIcon>
						<Text fw={500}>Parking Location</Text>
					</Group>

					{parkingInstructions && (
						<Text size="sm" c="dimmed">
							{parkingInstructions}
						</Text>
					)}

					<Button
						component="a"
						href={`http://maps.apple.com/?q=${parkingLatLong}`}
						target="_blank"
						leftSection={<IconMapPin size={16} />}
						variant="outline"
					>
						View Parking in Maps
					</Button>
				</Stack>
			)}
			{/* Parking to Entrance Route */}
			{parkingToEntranceRoute && (
				<Stack gap="md" mb="xl">
					<Group gap="xs">
						<ThemeIcon variant="light" color="teal">
							<IconWalk size={18} />
						</ThemeIcon>
						<Text fw={500}>Approach from Parking</Text>
					</Group>
					<Text size="sm">{parkingToEntranceRoute}</Text>
				</Stack>
			)}

			{/* Map Image Section - updated */}
			{mapImage?.url && (
				<Stack gap="sm" mb="xl">
					<Group gap="xs">
						<ThemeIcon variant="light" color="blue">
							<IconMapPin size={18} />
						</ThemeIcon>
						<Text fw={500}>Approach Map</Text>
					</Group>

					<Image
						src={mapImage.url}
						alt={mapImage.alt || "Map from parking to cave entrance"}
						radius="md"
						style={{
							maxWidth: "100%",
							border: "1px solid #dee2e6",
							borderRadius: 8,
						}}
					/>
					{mapImage.caption && (
						<Text size="sm" c="dimmed" mt="xs">
							{mapImage.caption}
						</Text>
					)}
				</Stack>
			)}

			{/* Entrance Section */}
			{entranceLatLong && (
				<Stack gap="sm" mb="xl">
					<Group gap="xs">
						<ThemeIcon variant="light" color="orange">
							<IconWalk size={18} />
						</ThemeIcon>
						<Text fw={500}>Cave Entrance</Text>
					</Group>

					<Button
						component="a"
						href={`http://maps.apple.com/?q=${entranceLatLong}`}
						target="_blank"
						leftSection={<IconMapPin size={16} />}
						variant="outline"
					>
						View Entrance in Maps
					</Button>
				</Stack>
			)}

			{/* Access Requirements */}
			{accessNotes.length > 0 && (
				<Stack gap="sm" mb="xl">
					<Group gap="xs">
						<ThemeIcon variant="light" color="violet">
							<IconKey size={18} />
						</ThemeIcon>
						<Text fw={500}>Access Requirements</Text>
					</Group>

					<List spacing="xs">
						{Array.isArray(accessNotes) ? (
							accessNotes.map((note, i) => (
								<List.Item
									key={`access-note-${i}-${note.substring(0, 10)}`}
									icon={<IconInfoCircle size={16} />}
								>
									{note}
								</List.Item>
							))
						) : (
							<List.Item icon={<IconInfoCircle size={16} />}>
								{String(accessNotes)}
							</List.Item>
						)}
					</List>
				</Stack>
			)}

			{/* New Access Info Buttons */}
			<Group gap="sm" mb="xl">
				{accessUrl && (
					<Button
						component="a"
						href={accessUrl}
						target="_blank"
						variant="outline"
						leftSection={<IconKey size={16} />}
					>
						Full Access Details
					</Button>
				)}
				{infoUrl && (
					<Button
						component="a"
						href={infoUrl}
						target="_blank"
						variant="outline"
						leftSection={<IconInfoCircle size={16} />}
					>
						Location Information
					</Button>
				)}
			</Group>



			{/* Conditional Reference Links */}
			{referenceLinks && referenceLinks.length > 0 && (
				<Paper withBorder p="md" radius="md" mt="md">
					<Text fw={500} mb="sm">
						More Information:
					</Text>
					<List spacing="xs">
						{referenceLinks.map((link) => (
							<List.Item key={`ref-link-${link.link_url}`}>
								<a
									href={link.link_url}
									target="_blank"
									rel="noopener noreferrer"
									style={{ textDecoration: "none" }}
								>
									<Text c="blue">{link.link_title}</Text>
								</a>
							</List.Item>
						))}
					</List>
				</Paper>
			)}
			{/* New Route Description Section */}
			{hasRouteDescription && (
				<Stack gap="md" mb="xl">
					<Group gap="xs">
						<ThemeIcon variant="light" color="green">
							<IconMapPin size={18} />
						</ThemeIcon>
						<Text fw={500}>Route Description</Text>
					</Group>

					{typeof routeDescription === "object" &&
					!Array.isArray(routeDescription) &&
					routeDescription.route_description_segment_html ? (
						<Text component="div">
							{/* Sanitize HTML content */}
							{routeDescription.route_description_segment_html.replace(
								/<\/?[^>]+(>|$)/g,
								"",
							)}
						</Text>
					) : (
						// Handle array format if needed
						<Text size="sm">{JSON.stringify(routeDescription)}</Text>
					)}
				</Stack>
			)}

		</Paper>
	);
}
