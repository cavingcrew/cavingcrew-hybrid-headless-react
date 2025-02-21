"use client";

const isMembershipCategory = (trip: Trip) => {
  return trip.categories.some(cat => cat.slug === 'memberships');
};

const isTrainingCategory = (trip: Trip) => {
  return trip.categories.some(cat => cat.slug === 'training-trips');
};

import { Badge, Card, Group, Image, Text, Tooltip } from "@mantine/core";
import { useUserStatus } from '@/lib/hooks/useUser';
import Link from "next/link";
import { useQueryClient } from '@tanstack/react-query';
import {IconArrowBarUp, IconStairs} from "@tabler/icons-react";
import { tripKeys } from '@/lib/hooks/useTrips';
import type { Trip } from "../../types/api";
import { getTripAvailability } from "@/utils/trip-utils";

const requiresSRT = (trip: Trip) => {
  // Check if trip is in SRT training category
  const isSRTTraining = trip.categories.some(cat => cat.slug === 'srt-training');

  // Check gear requirements from ACF
  const gearRequiresSRT = trip.acf.event_gear_required?.toLowerCase().includes('srt');

  return isSRTTraining || gearRequiresSRT;
};

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

  const { purchasedProducts } = useUserStatus();
  const hasPurchased = purchasedProducts?.includes(trip.id) || 
    trip.variations.some(v => purchasedProducts?.includes(v.id));

  console.log('[TripCard] Rendering', {
    tripId: trip.id,
    tripSlug: trip.slug,
    variations: trip.variations.map(v => v.id),
    purchasedProducts,
    hasPurchased
  });

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
				style={{ cursor: "pointer", position: "relative" }}
			>
        {hasPurchased && (
          <Badge 
            color="green" 
            variant="light" 
            style={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}
          >
            Booked
          </Badge>
        )}
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
					{!isMembershipCategory(trip) && (
						<Badge color={badgeColor}>
							{statusMessage}
						</Badge>
					)}
				</Group>
				{eventDate && (
					<Text size="sm" c="dimmed">
						{eventDate}
					</Text>
				)}


				<Text
					size="sm"
					c="dimmed"
					lineClamp={2}
					mt={4}
					dangerouslySetInnerHTML={{
						__html: trip.acf.event_description || "No description available"
					}}
				/>

        {!isMembershipCategory(trip) && !isTrainingCategory(trip) && (
          <Group mt="md" justify="space-between">
            <Tooltip label={
              trip.acf.event_type === 'overnight' 
                ? "Combination of horizontal and vertical caving" 
                : requiresSRT(trip) 
                  ? "Requires SRT skills" 
                  : "Horizontal caving only"
            }>
              <Group gap="xs">
                {trip.acf.event_type === 'overnight' ? (
                  <>
                    <IconStairs size={24} color="blue" />
                    <IconArrowBarUp size={24} color="blue" />
                  </>
                ) : requiresSRT(trip) ? (
                  <IconArrowBarUp size={24} color="red" />
                ) : (
                  <IconStairs size={24} color="green" />
                )}
                <Text size="sm" c="dimmed">
                  {trip.acf.event_type === 'overnight' 
                    ? "Horizontal/Vertical Caving"
                    : requiresSRT(trip) 
                      ? "SRT Required" 
                      : "Horizontal Caving"}
                </Text>
              </Group>
            </Tooltip>

            {trip.acf.event_non_members_welcome === 'no' && (
              <Badge color="blue" variant="light">
                Members Only
              </Badge>
            )}
          </Group>
        )}
        {hasPurchased && (
          <Badge color="green" variant="light" mt="sm">
            Booked
          </Badge>
        )}
			</Card>
		</Link>
	);
}
