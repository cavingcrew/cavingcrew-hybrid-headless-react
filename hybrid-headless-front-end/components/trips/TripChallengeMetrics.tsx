"use client";

import {
  Alert,
  Box,
  Grid,
  Group,
  Progress,
  Rating,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import {
  IconClock,
  IconMoodSmile,
  IconMountainOff,
} from "@tabler/icons-react";
import React from "react";
import type { Trip } from "../../types/api";
import { extractDifficultyMetrics } from "../../utils/difficulty-utils";

interface TripChallengeMetricsProps {
  trip: Trip;
}

/**
 * Renders a difficulty bar for a specific metric
 */
function DifficultyBar({ 
  value, 
  label, 
  color 
}: { 
  value: number | null; 
  label: string; 
  color: string;
}) {
  if (value === null) return null;
  
  return (
    <Box mb="xs">
      <Group justify="space-between" mb={5}>
        <Text size="sm">{label}</Text>
        <Text size="sm" fw={500}>
          {value}/5
        </Text>
      </Group>
      <Progress value={value * 20} color={color} size="sm" radius="xl" />
    </Box>
  );
}

/**
 * Component to display trip enjoyment rating and duration
 */
function TripEnjoymentRating({ 
  starRating, 
  estimatedTime 
}: { 
  starRating?: string; 
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
            <Rating value={parseInt(starRating, 10)} readOnly size="xl" />
            <Text size="xl" fw={700}>
              {starRating}/5
            </Text>
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
            <Text>Estimated Duration: {estimatedTime} hours</Text>
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
  
  const difficultyMetrics = extractDifficultyMetrics(routeData);
  
  if (!difficultyMetrics && !starRating && !estimatedTime) {
    return null;
  }

  return (
    <Stack gap="md" mb="xl">
      {difficultyMetrics && (
        <>
          <Group gap="xs">
            <ThemeIcon variant="light" color="red">
              <IconMountainOff size={18} />
            </ThemeIcon>
            <Text fw={500}>Challenge Metrics</Text>
          </Group>

          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Stack>
                <Text fw={500} size="sm">Physical Challenges</Text>
                {difficultyMetrics.physical.map(metric => (
                  <DifficultyBar 
                    key={metric.key}
                    value={metric.value} 
                    label={metric.label} 
                    color={metric.color} 
                  />
                ))}
              </Stack>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Stack>
                <Text fw={500} size="sm">Psychological Challenges</Text>
                {difficultyMetrics.psychological.map(metric => (
                  <DifficultyBar 
                    key={metric.key}
                    value={metric.value} 
                    label={metric.label} 
                    color={metric.color} 
                  />
                ))}
              </Stack>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Stack>
                <Text fw={500} size="sm">Environmental Challenges</Text>
                {difficultyMetrics.environmental.map(metric => (
                  <DifficultyBar 
                    key={metric.key}
                    value={metric.value} 
                    label={metric.label} 
                    color={metric.color} 
                  />
                ))}
              </Stack>
            </Grid.Col>
          </Grid>

          <Alert color="blue" icon={<IconMoodSmile size={18} />}>
            <Text size="sm">
              These ratings help you understand what to expect. If you have
              specific concerns about any aspect, please ask the trip leader
              before signing up.
            </Text>
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
