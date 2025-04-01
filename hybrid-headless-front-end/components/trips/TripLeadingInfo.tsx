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
  const routeAcf = trip.route?.acf;
  const leadingNotesHtml = routeAcf?.route_leading_notes;
  const waterImpactHtml = routeAcf?.route_water_impact;
  const leadingDifficulty = routeAcf?.route_leading_difficulty;

  const hasLeadingContent = leadingNotesHtml || waterImpactHtml ||
    (leadingDifficulty?.route_leading_difficulty_navigation_difficulty ||
     leadingDifficulty?.route_leading_difficulty_horizontal_leading_level_required);

  if (!hasLeadingContent || !isLoggedIn) return null;

  return (
    <Paper withBorder p="md" radius="md" mt="md">
      <Title order={2} mb="md">Leading This Trip</Title>

      {/* Leading Difficulty */}
      {leadingDifficulty && (
        <Stack gap="md" mb="xl">
          {leadingDifficulty.route_leading_difficulty_navigation_difficulty && (
            <Group mt="md">
              <Text fw={500}>Navigation Difficulty:</Text>
              <Badge
                size="lg"
                color={
                  parseInt(leadingDifficulty.route_leading_difficulty_navigation_difficulty, 10) <= 2.5
                    ? "green"
                    : parseInt(leadingDifficulty.route_leading_difficulty_navigation_difficulty, 10) <= 6.5
                      ? "yellow"
                      : "red"
                }
              >
                {leadingDifficulty.route_leading_difficulty_navigation_difficulty}/10
              </Badge>
            </Group>
          )}

          {leadingDifficulty.route_leading_difficulty_horizontal_leading_level_required?.post_title && (
            <>
              <Group align="center" mb="xs">
                <Badge size="lg" color="orange" variant="filled">
                  Suggested Leading Level:{" "}
                  {leadingDifficulty.route_leading_difficulty_horizontal_leading_level_required.post_title}
                </Badge>
                
                {leadingDifficulty.route_leading_difficulty_horizontal_leading_level_required.permalink && (
                  <Anchor
                    href={leadingDifficulty.route_leading_difficulty_horizontal_leading_level_required.permalink}
                    target="_blank"
                    size="sm"
                  >
                    View Leading Level
                  </Anchor>
                )}
              </Group>

              {/* SRT Leading Level */}
              {leadingDifficulty.route_leading_difficulty_srt_leading_level_required && (
                <Group align="center" mb="xs">
                  <Badge size="lg" color="red" variant="filled">
                    SRT Leading Level:{" "}
                    {typeof leadingDifficulty.route_leading_difficulty_srt_leading_level_required === 'object' 
                      ? leadingDifficulty.route_leading_difficulty_srt_leading_level_required.post_title
                      : `Level ${leadingDifficulty.route_leading_difficulty_srt_leading_level_required}`}
                  </Badge>
                  
                  {typeof leadingDifficulty.route_leading_difficulty_srt_leading_level_required === 'object' && 
                   leadingDifficulty.route_leading_difficulty_srt_leading_level_required.permalink && (
                    <Anchor
                      href={leadingDifficulty.route_leading_difficulty_srt_leading_level_required.permalink}
                      target="_blank"
                      size="sm"
                    >
                      View SRT Leading Level
                    </Anchor>
                  )}
                </Group>
              )}

              {leadingDifficulty.route_leading_difficulty_horizontal_leading_skills_required &&
                leadingDifficulty.route_leading_difficulty_horizontal_leading_skills_required.length > 0 && (
                  <div>
                    <Text fw={500}>Suggested Horizontal Leading Skills:</Text>
                    <List>
                      {leadingDifficulty.route_leading_difficulty_horizontal_leading_skills_required.map(
                        (skill: string, i: number) => (
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
                        ),
                      )}
                    </List>
                  </div>
                )}
              
              {/* SRT Leading Skills */}
              {leadingDifficulty.route_leading_difficulty_srt_leading_skills_required &&
                leadingDifficulty.route_leading_difficulty_srt_leading_skills_required.length > 0 && (
                  <div>
                    <Text fw={500}>Suggested SRT Leading Skills:</Text>
                    <List>
                      {leadingDifficulty.route_leading_difficulty_srt_leading_skills_required.map(
                        (skill: string, i: number) => (
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
                        ),
                      )}
                    </List>
                  </div>
                )}
            </>
          )}
        </Stack>
      )}

      {/* Leading Notes */}
      {leadingNotesHtml && (
        <Stack gap="md" mb="xl">
          <Group gap="xs">
            <ThemeIcon variant="light" color="blue">
              <IconInfoCircle size={18} />
            </ThemeIcon>
            <Text fw={500}>Leadership Notes</Text>
          </Group>
          <div dangerouslySetInnerHTML={{ __html: leadingNotesHtml }} />
        </Stack>
      )}

      {/* Water Impact */}
      {waterImpactHtml && (
        <Stack gap="md">
          <Group gap="xs">
            <ThemeIcon variant="light" color="cyan">
              <IconDroplet size={18} />
            </ThemeIcon>
            <Text fw={500}>Water Impact</Text>
          </Group>
          <div dangerouslySetInnerHTML={{ __html: waterImpactHtml }} />
        </Stack>
      )}
    </Paper>
  );
}
