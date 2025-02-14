"use client";

import { Badge, Card, Group, Image, Text } from "@mantine/core";
import Link from "next/link";
import { useQueryClient } from '@tanstack/react-query';
import { tripKeys } from '@/lib/hooks/useTrips';
import type { Trip } from "../../types/api";
import { getTripAvailability } from "@/utils/trip-utils";

const formatDateWithOrdinal = (dateString: string) => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  };
  
  return date.toLocaleDateString('en-GB', options)
    .replace(/(\d+)/, (_, day) => {
      const suffixes = ['th', 'st', 'nd', 'rd'];
      const v = day % 100;
      return day + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
    });
};

interface TripCardProps {
	trip: Trip;
}

export default function TripCard({ trip }: TripCardProps) {
	const queryClient = useQueryClient();
  const { statusMessage, badgeColor } = getTripAvailability(trip);
  const eventDate = trip.acf.event_start_date_time 
    ? formatDateWithOrdinal(trip.acf.event_start_date_time)
    : null;

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
					<Badge color={badgeColor}>
						{statusMessage}
					</Badge>
				</Group>

				{eventDate && (
					<Text size="sm" c="dimmed">
						{eventDate}
					</Text>
				)}

				<Text size="sm" c="dimmed" lineClamp={2} mt={4}>
					{trip.acf.event_description || "No description available"}
				</Text>

				<Group mt="md" justify="space-between">
					<Text size="xl" fw={700} c="blue">
						£{trip.acf.event_cost || trip.price}
						{trip.acf.event_non_members_welcome === 'no' && 
							' (Membership Required)'}
						{trip.acf.event_non_members_welcome === 'yes' && 
							' (Membership Not Required)'}
					</Text>
				</Group>
			</Card>
		</Link>
	);
}
