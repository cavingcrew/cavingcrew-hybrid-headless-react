"use client";

import { Alert, Box, Group, Image, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconLock, IconMapPin } from "@tabler/icons-react";
import React from "react";
import type { Route } from "../../types/api";

interface RouteDescriptionSegment {
  // New fields
  title?: string;
  content?: string;
  image?: {
    url: string;
    alt?: string;
  } | null;
  
  // Legacy fields
  route_description_segment_title?: string;
  route_description_segment_html?: string;
  route_description_segment_photo?: {
    url: string;
    alt?: string;
  } | null;
}

interface TripRouteDescriptionProps {
  routeDescription: RouteDescriptionSegment[] | Record<string, RouteDescriptionSegment> | null | undefined;
  hasPurchased: boolean;
}

export function TripRouteDescription({ 
  routeDescription,
  hasPurchased
}: TripRouteDescriptionProps) {
  // Convert to array if not already
  const segments: RouteDescriptionSegment[] = Array.isArray(routeDescription) 
    ? routeDescription 
    : routeDescription && typeof routeDescription === 'object' 
      ? Object.values(routeDescription).filter(Boolean) as RouteDescriptionSegment[]
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

      {visibleSegments.map((segment, index) => {
        const title = segment.title || segment.route_description_segment_title || "";
        const content = segment.content || segment.route_description_segment_html || "";
        const image = segment.image || segment.route_description_segment_photo;

        return (
          <Box key={`segment-${index}`}>
            <Text fw={600} size="lg" mb="md">
              {index + 1}. {title}
            </Text>

            <Box
              style={{
                display: "grid",
                gridTemplateColumns: image?.url 
                  ? "1fr 1fr" 
                  : "1fr",
                gap: "1.5rem",
                alignItems: "start",
              }}
            >
              <div
                dangerouslySetInnerHTML={{ __html: content }}
                style={{ lineHeight: 1.6 }}
              />

              {image?.url && (
                <Image
                  src={image.url}
                  alt={image.alt || `Route section ${index + 1}`}
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
        );
      })}

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
