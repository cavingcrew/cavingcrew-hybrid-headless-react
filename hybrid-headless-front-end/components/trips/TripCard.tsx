"use client";

import { Badge, Card, Group, Image, Text } from "@mantine/core";
import Link from "next/link";
import { useQueryClient } from '@tanstack/react-query';
import { tripKeys } from '@/lib/hooks/useTrips';
import React from "react";
import type { Trip } from "../../types/api";
import { getTripAvailability } from "@/utils/trip-utils";

interface TripCardProps {
	trip: Trip;
}

export default function TripCard({ trip }: TripCardProps) {
	const queryClient = useQueryClient();

	return (
		<Link 
			href={`/trip/${trip.slug}`}
			style={{ textDecoration: "none", color: "inherit" }}
			onMouseEnter={() => {
				queryClient.prefetchQuery({
					queryKey: tripKeys.detail(trip.slug),
					queryFn: () => ({ data: trip, success: true }),
				});
			}}
		>
			<Card
				shadow="sm"
				padding="lg"
				radius="md"
				withBorder
				style={{ cursor: "pointer" }}
			>
				{trip.images?.[0] && (
					<Card.Section>
						<Image
							src={trip.images[0].src}
							alt={trip.images[0].alt}
							height={160}
						/>
					</Card.Section>
				)}

				<Group justify="space-between" mt="md" mb="xs">
					<Text fw={500}>{trip.name}</Text>
					<Badge color={getTripAvailability(trip).badgeColor}>
						{getTripAvailability(trip).statusMessage}
					</Badge>
				</Group>

				<Text size="sm" c="dimmed" lineClamp={2}>
					{trip.acf.event_description || "No description available"}
				</Text>

				<Group mt="md" justify="space-between">
					<Text size="xl" fw={700} c="blue">
						£{trip.acf.event_cost || trip.price}
					</Text>
				</Group>
			</Card>
		</Link>
	);
}
