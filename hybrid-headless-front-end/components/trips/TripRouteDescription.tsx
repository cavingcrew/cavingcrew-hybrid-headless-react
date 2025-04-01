"use client";

import { Alert, Box, Group, Image, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconLock, IconMapPin } from "@tabler/icons-react";
import React from "react";
import type { Route } from "../../types/api";

// Define the segment type
interface RouteDescriptionSegment {
  route_description_segment_title?: string;
  route_description_segment_html?: string;
  route_description_segment_photo?: {
    url: string;
    alt?: string;
  };
  // Fallback for older format
  section_title?: string;
  section_content?: string;
}

interface TripRouteDescriptionProps {
  routeDescription: Route["acf"]["route_route_description"];
  hasPurchased: boolean;
}

export function TripRouteDescription({ 
  routeDescription,
  hasPurchased
}: TripRouteDescriptionProps) {
  // Extract segments from the route description
  const getSegments = (): RouteDescriptionSegment[] => {
    if (!routeDescription) return [];
    
    if (Array.isArray(routeDescription)) {
      return routeDescription;
    }
    
    // Handle single object case by wrapping in array
    if (typeof routeDescription === "object") {
      return [routeDescription];
    }
    
    return [];
  };

  const segments = getSegments();
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
        // Handle both old and new segment formats
        const title = segment.route_description_segment_title || segment.section_title || `Section ${index + 1}`;
        const content = segment.route_description_segment_html || segment.section_content || "";
        const photo = segment.route_description_segment_photo;

        return (
          <Box key={`segment-${index}`} style={{ position: "relative" }}>
            {/* Section Header with Number */}
            <Text fw={600} size="lg" mb="md">
              {index + 1}. {title}
            </Text>

            {/* Content with alternating image layout */}
            <Box
              style={{
                display: "grid",
                gridTemplateColumns: photo?.url ? "1fr 1fr" : "1fr",
                gap: "1.5rem",
                alignItems: "start",
              }}
            >
              {/* Text content */}
              <div
                dangerouslySetInnerHTML={{ __html: content }}
                style={{ lineHeight: 1.6 }}
              />

              {/* Image - alternate sides for each section */}
              {photo?.url && (
                <Image
                  src={photo.url}
                  alt={photo.alt || `Route section ${index + 1}`}
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

      {/* Blur overlay for non-purchased users */}
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
