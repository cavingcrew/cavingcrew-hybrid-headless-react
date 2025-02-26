"use client";

import { Carousel } from "@mantine/carousel";
import {
	Alert,
	Box,
	Button,
	Divider,
	Group,
	Image,
	List,
	Modal,
	Paper,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
	IconInfoCircle,
	IconKey,
	IconLink,
	IconMapPin,
	IconParking,
	IconPhoto,
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
		((typeof routeDescription === "object" &&
			!Array.isArray(routeDescription) &&
			routeDescription.route_description_segment_html?.trim()) ||
			(Array.isArray(routeDescription) &&
				routeDescription.some(
					(section) =>
						section.section_title?.trim() || section.section_content?.trim(),
				)));
	const parkingInstructions = locationData?.location_parking_description;
	const entranceCoords = locationData?.location_entrance_latlong;
	const parkingCoords = locationData?.location_parking_latlong;
	const parkingToEntranceRoute =
		locationData?.location_parking_entrance_route_description;
	const referenceLinks = locationData?.location_reference_links?.filter(
		(link) => link.link_title?.trim() && link.link_url?.trim(),
	);
	const mapImage = locationData?.location_map_from_parking_to_entrance;
	const accessUrl = locationData?.location_access_url;
	const infoUrl = locationData?.location_info_url;
	const isSensitiveAccess = locationData?.location_sensitive_access;

	// Modal state for map enlargement
	const [mapModalOpened, { open: openMapModal, close: closeMapModal }] =
		useDisclosure(false);

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
						<div
							// Content from WordPress sanitized HTML
							dangerouslySetInnerHTML={{ __html: parkingInstructions }}
							style={{ lineHeight: 1.5 }}
						/>
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

			{/* Parking Photos Gallery */}
			{locationData?.location_parking_photos &&
				locationData.location_parking_photos.length > 0 && (
					<Stack gap="sm" mb="xl">
						<Group gap="xs">
							<ThemeIcon variant="light" color="blue">
								<IconPhoto size={18} />
							</ThemeIcon>
							<Text fw={500}>Parking Area Photos</Text>
						</Group>

						<Carousel
							slideSize="70%"
							height={300}
							slideGap="md"
							controlsOffset="xs"
							dragFree
							withIndicators
						>
							{locationData.location_parking_photos.map((photo, i) => (
								<Carousel.Slide key={`parking-photo-${photo.ID || photo.url}`}>
									<Image
										src={photo.url}
										alt={photo.alt || `Parking area photo ${i + 1}`}
										height={300}
										style={{ objectFit: "cover" }}
									/>
									{photo.caption && (
										<Text size="sm" c="dimmed" mt="xs">
											{photo.caption}
										</Text>
									)}
								</Carousel.Slide>
							))}
						</Carousel>
					</Stack>
				)}

			{/* Entrance Section */}

			{/* Parking to Entrance Route */}
			{parkingToEntranceRoute && (
				<Stack gap="md" mb="xl">
					<Group gap="xs">
						<ThemeIcon variant="light" color="teal">
							<IconWalk size={18} />
						</ThemeIcon>
						<Text fw={500}>Approach from Parking</Text>
					</Group>
					<div
						// Content from WordPress sanitized HTML
						dangerouslySetInnerHTML={{ __html: parkingToEntranceRoute }}
						style={{ lineHeight: 1.5 }}
					/>
				</Stack>
			)}
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

			{/* Map Image Section - updated with click-to-enlarge */}
			{mapImage?.url && (
				<Stack gap="sm" mb="xl">
					<Group gap="xs">
						<ThemeIcon variant="light" color="blue">
							<IconMapPin size={18} />
						</ThemeIcon>
						<Text fw={500}>Approach Map</Text>
					</Group>

					<Box style={{ cursor: "pointer" }} onClick={openMapModal}>
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
					</Box>
					{mapImage.caption && (
						<Text size="sm" c="dimmed" mt="xs">
							{mapImage.caption}
						</Text>
					)}

					<Modal
						opened={mapModalOpened}
						onClose={closeMapModal}
						size="xl"
						title="Approach Map"
						centered
					>
						<Image
							src={mapImage.url}
							alt={mapImage.alt || "Map from parking to cave entrance"}
							style={{ width: "100%", height: "auto" }}
						/>
						{mapImage.caption && (
							<Text size="sm" c="dimmed" mt="md">
								{mapImage.caption}
							</Text>
						)}
					</Modal>
				</Stack>
			)}

			{/* Entrance Photos Gallery */}
			{locationData?.location_entrance_photos &&
				locationData.location_entrance_photos.length > 0 && (
					<Stack gap="sm" mb="xl">
						<Group gap="xs">
							<ThemeIcon variant="light" color="orange">
								<IconPhoto size={18} />
							</ThemeIcon>
							<Text fw={500}>Entrance Photos</Text>
						</Group>

						<div
							style={{
								display: "grid",
								gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
								gap: "1rem",
							}}
						>
							{locationData.location_entrance_photos.map((photo, i) => (
								<div key={`entrance-photo-${photo.ID || photo.url}`}>
									<Image
										src={photo.url}
										alt={photo.alt || `Cave entrance photo ${i + 1}`}
										radius="md"
										style={{
											height: 200,
											objectFit: "cover",
										}}
									/>
									{photo.caption && (
										<Text size="sm" c="dimmed" mt="xs">
											{photo.caption}
										</Text>
									)}
								</div>
							))}
						</div>
					</Stack>
				)}

			{/* Access Requirements */}
			{accessNotes.length > 0 && (
				<Stack gap="sm" mb="xl">
					<Group gap="xs">
						<ThemeIcon variant="light" color="violet">
							<IconKey size={18} />
						</ThemeIcon>
						<Text fw={500}>Access in Short</Text>
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

			{/* Combined Button Group */}
			<Group gap="sm" mb="xl" wrap="wrap">
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
				{referenceLinks?.map((link) => (
					<Button
						key={`ref-btn-${link.link_url}`}
						component="a"
						href={link.link_url}
						target="_blank"
						variant="outline"
						leftSection={<IconLink size={16} />}
					>
						{link.link_title}
					</Button>
				))}
			</Group>
			{/* Updated Route Description Section */}
			{hasRouteDescription && (
				<Stack gap="md" mb="xl">
					<Group gap="xs">
						<ThemeIcon variant="light" color="green">
							<IconMapPin size={18} />
						</ThemeIcon>
						<Text fw={500}>Route Description</Text>
					</Group>

					<div style={{ position: "relative" }}>
						<div
							style={{
								maxHeight: 200,
								overflow: "hidden",
								position: "relative",
								maskImage:
									"linear-gradient(to bottom, black 50%, transparent 100%)",
								WebkitMaskImage:
									"linear-gradient(to bottom, black 50%, transparent 100%)",
							}}
						>
							{typeof routeDescription === "object" &&
							!Array.isArray(routeDescription) &&
							routeDescription.route_description_segment_html ? (
								<div
									// Content from WordPress sanitized HTML
									dangerouslySetInnerHTML={{
										__html: routeDescription.route_description_segment_html,
									}}
									style={{ lineHeight: 1.5 }}
								/>
							) : Array.isArray(routeDescription) &&
								routeDescription.length > 0 ? (
								<Stack gap="xs">
									{routeDescription.map((section) => (
										<div key={`route-section-${section.section_title || section.section_content?.substring(0, 20)}`}>
											{section.section_title && (
												<Text fw={500} size="sm">
													{section.section_title}
												</Text>
											)}
											{section.section_content && (
												<Text size="sm">{section.section_content}</Text>
											)}
										</div>
									))}
								</Stack>
							) : (
								<Text size="sm" c="dimmed">
									Route description not available
								</Text>
							)}
						</div>

						<div
							style={{
								position: "absolute",
								bottom: 0,
								left: 0,
								right: 0,
								height: "100%",
								background:
									"linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,1) 100%)",
								display: "flex",
								alignItems: "flex-end",
								justifyContent: "center",
								pointerEvents: "none",
							}}
						>
							<Text
								size="sm"
								c="dimmed"
								ta="center"
								p="md"
								style={{
									backgroundColor: "rgba(255,255,255,0.9)",
									borderRadius: 8,
									width: "100%",
								}}
							>
								Route descriptions available soon for Leaders
							</Text>
						</div>
					</div>
				</Stack>
			)}
		</Paper>
	);
}
