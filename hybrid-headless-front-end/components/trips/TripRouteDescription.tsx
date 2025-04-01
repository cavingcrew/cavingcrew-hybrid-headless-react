"use client";

import { Alert, Box, Group, Image, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconLock, IconMapPin } from "@tabler/icons-react";
import React from "react";
import type { Route } from "../../types/api";

interface RouteDescriptionSegment {
  route_description_segment_title: string;
  route_description_segment_html: string;
  route_description_segment_photo?: {
    url: string;
    alt?: string;
  };
}

interface TripRouteDescriptionProps {
  routeDescription: RouteDescriptionSegment[] | null | undefined;
  hasPurchased: boolean;
}

export function TripRouteDescription({ 
  routeDescription,
  hasPurchased
}: TripRouteDescriptionProps) {
  // Convert to array if not already
  const segments: RouteDescriptionSegment[] = Array.isArray(routeDescription) 
    ? routeDescription 
    : [];

  const visibleSegments = hasPurchased ? segments : segments.slice(0, 1);

  if (segments.length === 0) return null;

  return (
    <Stack gap="xl">
      <Group gap="xs">
        <ThemeIcon variant="light" color="green">
          <IconMapPin size={18} />
        </ThemeIcon>
        <Text fw={500}>Route Description</Text>
        {!hasPurchased && (
          <Alert color="blue" icon={<IconLock size={16} />} ml="auto">
            Sign up to view full route details
          </Alert>
        )}
      </Group>

      {visibleSegments.map((segment, index) => (
        <Box key={`segment-${index}`}>
          <Text fw={600} size="lg" mb="md">
            {index + 1}. {segment.route_description_segment_title}
          </Text>

          <Box
            style={{
              display: "grid",
              gridTemplateColumns: segment.route_description_segment_photo?.url 
                ? "1fr 1fr" 
                : "1fr",
              gap: "1.5rem",
              alignItems: "start",
            }}
          >
            <div
              dangerouslySetInnerHTML={{ __html: segment.route_description_segment_html }}
              style={{ lineHeight: 1.6 }}
            />

            {segment.route_description_segment_photo?.url && (
              <Image
                src={segment.route_description_segment_photo.url}
                alt={segment.route_description_segment_photo.alt || `Route section ${index + 1}`}
                radius="sm"
                style={{
                  gridColumn: index % 2 === 0 ? "2" : "1",
                  gridRow: "1",
                  height: "auto",
                  maxHeight: "400px",
                  objectFit: "cover",
                }}
              />
            )}
          </Box>
        </Box>
      ))}

      {!hasPurchased && segments.length > 1 && (
        <Box
          style={{
            position: "relative",
            height: "100px",
            marginTop: "-100px",
            background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,1) 100%)",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
      )}
    </Stack>
  );
}
