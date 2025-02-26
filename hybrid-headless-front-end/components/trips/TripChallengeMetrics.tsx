"use client";

import {
  Alert,
  Box,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Rating,
} from "@mantine/core";
import {
  IconClock,
  IconMoodSmile,
  IconMountainOff,
} from "@tabler/icons-react";
import React from "react";
import type { Trip } from "../../types/api";
import { extractChallengeMetrics } from "../../utils/difficulty-utils";
import { TripChallengeIndicator } from "./TripChallengeIndicator";

interface TripChallengeMetricsProps {
  trip: Trip;
}

/**
 * Component to display trip enjoyment rating and duration
 */
function TripEnjoymentRating({
  starRating,
  estimatedTime
}: {
  starRating?: string | number;
  estimatedTime?: string;
}) {
  if (!starRating && !estimatedTime) return null;

  return (
    <Stack gap="md" align="center">
      {starRating && (
        <Box>
          <Text ta="center" fw={500} mb="xs">
            Trip Enjoyment Rating
          </Text>
          <Group justify="center">
            <Rating value={typeof starRating === 'string' ? parseInt(starRating) : starRating} readOnly size="xl" />
          </Group>
          <Text size="sm" c="dimmed" ta="center" mt="xs">
            Based on member feedback
          </Text>
        </Box>
      )}
      {estimatedTime && (
        <Box>
          <Group gap="xs" justify="center">
            <IconClock size={18} />
            <Text>Estimated Approx Duration: {estimatedTime+(estimatedTime*0.25)} hours</Text>
          </Group>
        </Box>
      )}
    </Stack>
  );
}

export function TripChallengeMetrics({ trip }: TripChallengeMetricsProps) {
  const routeData = trip.route?.acf;
  const starRating = routeData?.route_trip_star_rating;
  const estimatedTime = routeData?.route_time_for_eta;

  const challengeResult = extractChallengeMetrics(routeData);
  const challengeMetrics = challengeResult?.metrics;
  const weightedRank = challengeResult?.weightedRank;

  if (!challengeMetrics && !starRating && !estimatedTime) {
    return null;
  }

  return (
    <Stack gap="md" mb="xl">
      <Group gap="xs">
        <ThemeIcon variant="light" color="red">
          <IconMountainOff size={18} />
        </ThemeIcon>
        <Text fw={500}>Challenge Rating</Text>
      </Group>

      {challengeMetrics && (
        <>
          <TripChallengeIndicator
            metrics={challengeMetrics}
            weightedRank={weightedRank}
          />

          <Alert color="blue" icon={<IconMoodSmile size={18} />}>

          </Alert>
        </>
      )}

      {(starRating || estimatedTime) && (
        <TripEnjoymentRating
          starRating={starRating}
          estimatedTime={estimatedTime}
        />
      )}
    </Stack>
  );
}
