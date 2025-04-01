"use client";

import { Alert, Box, Group, Image, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconLock, IconMapPin } from "@tabler/icons-react";
import React from "react";
import type { Route } from "../../types/api";

interface TripRouteDescriptionProps {
  routeDescription: Route["acf"]["route_route_description"];
  hasPurchased: boolean;
}

export function TripRouteDescription({ 
  routeDescription,
  hasPurchased
}: TripRouteDescriptionProps) {
  if (!routeDescription || !Array.isArray(routeDescription)) return null;

  const visibleSegments = hasPurchased 
    ? routeDescription 
    : routeDescription.slice(0, 1);

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
            {index + 1}. {segment.title}
          </Text>

          <Box
            style={{
              display: "grid",
              gridTemplateColumns: segment.image?.url 
                ? "1fr 1fr" 
                : "1fr",
              gap: "1.5rem",
              alignItems: "start",
            }}
          >
            <div
              dangerouslySetInnerHTML={{ __html: segment.content }}
              style={{ lineHeight: 1.6 }}
            />

            {segment.image?.url && (
              <Image
                src={segment.image.url}
                alt={segment.image.alt || `Route section ${index + 1}`}
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

      {!hasPurchased && routeDescription.length > 1 && (
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
