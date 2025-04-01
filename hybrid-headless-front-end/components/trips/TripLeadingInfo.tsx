"use client";

import { Alert, Box, Group, List, Paper, Stack, Text, ThemeIcon, Title, Badge, Anchor } from "@mantine/core";
import { IconMountain, IconInfoCircle, IconStar, IconDroplet } from "@tabler/icons-react";
import React from "react";
import type { Trip } from "../../types/api";
import { useUser } from "@/lib/hooks/useUser";

interface TripLeadingInfoProps {
  trip: Trip;
}

export function TripLeadingInfo({ trip }: TripLeadingInfoProps) {
  const { isLoggedIn } = useUser();

  // Directly access nested properties with optional chaining
  const hasLeadingContent =
    trip.route?.acf?.route_leading_difficulty?.route_leading_difficulty_navigation_difficulty ||
    trip.route?.acf?.route_leading_difficulty?.route_leading_difficulty_horizontal_leading_level_required;

  if (!hasLeadingContent || !isLoggedIn) return null;

  return (
    <Paper withBorder p="md" radius="md" mt="md">
      <Title order={2} mb="md">Leading This Trip</Title>

      {/* Leading Difficulty Section */}
      {trip.route?.acf?.route_leading_difficulty && (
        <Stack gap="md" mb="xl">
          {/* Navigation Difficulty */}
          {trip.route.acf.route_leading_difficulty.route_leading_difficulty_navigation_difficulty && (
            <Group mt="md">
              <Text fw={500}>Navigation Difficulty:</Text>
              <Badge
                size="lg"
                color={
                  parseInt(trip.route.acf.route_leading_difficulty.route_leading_difficulty_navigation_difficulty, 10) <= 2.5
                    ? "green"
                    : parseInt(trip.route.acf.route_leading_difficulty.route_leading_difficulty_navigation_difficulty, 10) <= 6.5
                      ? "yellow"
                      : "red"
                }
              >
                {trip.route.acf.route_leading_difficulty.route_leading_difficulty_navigation_difficulty}/10
              </Badge>
            </Group>
          )}

          {/* Horizontal Leading Level */}
          {trip.route.acf.route_leading_difficulty.route_leading_difficulty_horizontal_leading_level_required?.post_title && (
            <>
              <Group align="center" mb="xs">
                <Badge size="lg" color="orange" variant="filled">
                  Suggested Leading Level:{" "}
                  {trip.route.acf.route_leading_difficulty.route_leading_difficulty_horizontal_leading_level_required.post_title}
                </Badge>

                {trip.route.acf.route_leading_difficulty.route_leading_difficulty_horizontal_leading_level_required.permalink && (
                  <Anchor
                    href={trip.route.acf.route_leading_difficulty.route_leading_difficulty_horizontal_leading_level_required.permalink}
                    target="_blank"
                    size="sm"
                  >
                    View Leading Level
                  </Anchor>
                )}
              </Group>

              {/* SRT Leading Level */}
              {trip.route.acf.route_leading_difficulty.route_leading_difficulty_srt_leading_level_required && (
                <Group align="center" mb="xs">
                  <Badge size="lg" color="red" variant="filled">
                    SRT Leading Level:{" "}
                    {typeof trip.route.acf.route_leading_difficulty.route_leading_difficulty_srt_leading_level_required === 'object'
                      ? (trip.route.acf.route_leading_difficulty.route_leading_difficulty_srt_leading_level_required &&
                         'post_title' in trip.route.acf.route_leading_difficulty.route_leading_difficulty_srt_leading_level_required
                         ? trip.route.acf.route_leading_difficulty.route_leading_difficulty_srt_leading_level_required.post_title
                         : 'Unknown')
                      : `Level ${trip.route.acf.route_leading_difficulty.route_leading_difficulty_srt_leading_level_required}`}
                  </Badge>

                  {typeof trip.route.acf.route_leading_difficulty.route_leading_difficulty_srt_leading_level_required === 'object' &&
                   trip.route.acf.route_leading_difficulty.route_leading_difficulty_srt_leading_level_required &&
                   'permalink' in trip.route.acf.route_leading_difficulty.route_leading_difficulty_srt_leading_level_required &&
                   trip.route.acf.route_leading_difficulty.route_leading_difficulty_srt_leading_level_required.permalink && (
                    <Anchor
                      href={trip.route.acf.route_leading_difficulty.route_leading_difficulty_srt_leading_level_required.permalink}
                      target="_blank"
                      size="sm"
                    >
                      View SRT Leading Level
                    </Anchor>
                  )}
                </Group>
              )}

              {/* Leading Skills Lists */}
              {(trip.route.acf.route_leading_difficulty.route_leading_difficulty_horizontal_leading_skills_required ?? []).length > 0 && (
                <div>
                  <Text fw={500}>Suggested Horizontal Leading Skills:</Text>
                  <List>
                    {trip.route.acf.route_leading_difficulty.route_leading_difficulty_horizontal_leading_skills_required?.map(
                      (skill, i) => (
                        <List.Item
                          key={`skill-${skill.substring(0, 10)}-${i}`}
                          icon={
                            <ThemeIcon color="orange" size={24} radius="xl">
                              <IconStar size={16} />
                            </ThemeIcon>
                          }
                        >
                          {skill}
                        </List.Item>
                      )
                    )}
                  </List>
                </div>
              )}

              {(trip.route.acf.route_leading_difficulty.route_leading_difficulty_srt_leading_skills_required ?? []).length > 0 && (
                <div>
                  <Text fw={500}>Suggested SRT Leading Skills:</Text>
                  <List>
                    {trip.route.acf.route_leading_difficulty.route_leading_difficulty_srt_leading_skills_required?.map(
                      (skill, i) => (
                        <List.Item
                          key={`srt-skill-${skill.substring(0, 10)}-${i}`}
                          icon={
                            <ThemeIcon color="red" size={24} radius="xl">
                              <IconStar size={16} />
                            </ThemeIcon>
                          }
                        >
                          {skill}
                        </List.Item>
                      )
                    )}
                  </List>
                </div>
              )}
            </>
          )}
        </Stack>
      )}

      {/* Leading Notes */}
      {trip.route?.acf?.route_leading_notes && (
        <Stack gap="md" mb="xl">
          <Group gap="xs">
            <ThemeIcon variant="light" color="blue">
              <IconInfoCircle size={18} />
            </ThemeIcon>
            <Text fw={500}>Leadership Notes</Text>
          </Group>
          <div dangerouslySetInnerHTML={{ __html: trip.route.acf.route_leading_notes }} />
        </Stack>
      )}

      {/* Water Impact */}
      {trip.route?.acf?.route_water_impact && (
        <Stack gap="md">
          <Group gap="xs">
            <ThemeIcon variant="light" color="cyan">
              <IconDroplet size={18} />
            </ThemeIcon>
            <Text fw={500}>Water Impact</Text>
          </Group>
          <div dangerouslySetInnerHTML={{ __html: trip.route.acf.route_water_impact }} />
        </Stack>
      )}
    </Paper>
  );
}
