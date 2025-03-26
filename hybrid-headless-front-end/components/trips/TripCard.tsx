"use client";

import { useQueryClient } from '@tanstack/react-query';
import { Badge, Card, Group, Image, Text, Tooltip } from "@mantine/core";
import { useUser } from '@/lib/hooks/useUser';
import Link from "next/link";
import { IconArrowBarUp, IconStairs } from "@tabler/icons-react";
import { useTripCache } from '@/lib/hooks/useCache';
import type { Trip } from "../../types/api";
import { getTripAvailability } from "@/utils/trip-utils";

const isMembershipCategory = (trip: Trip) => {
    return trip.categories.some(cat => cat.slug === 'memberships');
};

const isTrainingCategory = (trip: Trip) => {
    return trip.categories.some(cat => cat.slug === 'training-trips');
};

const requiresSRT = (trip: Trip) => {
  // Check if trip is in SRT training category
  const isSRTTraining = trip.categories.some(cat => cat.slug === 'srt-training');

  // Check gear requirements from ACF
  const gearRequiresSRT = trip.acf.event_gear_required?.toLowerCase().includes('srt');
  
  // Check skills requirements from ACF
  const skillsRequiresSRT = trip.acf.event_skills_required?.toLowerCase().includes('srt');
  
  // Check route description for SRT mentions
  const routeHasSRT = trip.route?.acf?.route_blurb?.toLowerCase().includes('srt') || 
                      trip.route?.acf?.route_personal_gear_required?.includes('SRT Kit');

  return isSRTTraining || gearRequiresSRT || skillsRequiresSRT || routeHasSRT;
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

  const { purchasedProducts } = useUser();
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
      onMouseEnter={() => useTripCache().prefetchTrip(trip.slug)}
    >
			<Card
				shadow="sm"
				padding="lg"
				radius="md"
				withBorder
				style={{ cursor: "pointer", position: "relative" }}
			>

				{trip.images?.[0] && (
					<Card.Section>
						<Image
							src={trip.images[0].sizes?.medium_large?.file || trip.images[0].src}
							alt={trip.images[0].alt || "Trip image"}
							height={160}
						/>
					</Card.Section>
				)}

				<Group justify="space-between" mt="md" mb="xs">
					<Text fw={500}>{trip.name}</Text>
					<Group gap="xs">
						{!isMembershipCategory(trip) && (
							<Badge color={badgeColor}>
								{statusMessage}
							</Badge>
						)}
						{hasPurchased && (
							<Badge color="green" variant="light">
								Signed Up
							</Badge>
						)}
					</Group>
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
            {trip.acf.event_u18s_come === 'yes' && (
              <Badge color="pink" variant="light">
                U18s Welcome
              </Badge>
            )}
            {trip.acf.event_u18s_come === 'no' && (
              <Badge color="gray" variant="light">
                18+ Only
              </Badge>
            )}
          </Group>
        )}
			</Card>
		</Link>
	);
}
