"use client";

import { Group, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconMapPin } from "@tabler/icons-react";
import React from "react";
import type { Route } from "../../types/api";

interface TripRouteDescriptionProps {
  routeDescription: Route["acf"]["route_route_description"];
}

export function TripRouteDescription({ routeDescription }: TripRouteDescriptionProps) {
  const hasContent = routeDescription &&
    ((typeof routeDescription === "object" &&
      !Array.isArray(routeDescription) &&
      routeDescription.route_description_segment_html?.trim()) ||
      (Array.isArray(routeDescription) &&
        routeDescription.some(
          (section) =>
            section.section_title?.trim() || section.section_content?.trim(),
        )));

  if (!hasContent) return null;

  return (
    <Stack gap="md" mb="xl">
      <Group gap="xs">
        <ThemeIcon variant="light" color="green">
          <IconMapPin size={18} />
        </ThemeIcon>
        <Text fw={500}>Route Description</Text>
      </Group>

      <div style={{ position: "relative" }}>
        <div
          style={{
            maxHeight: 200,
            overflow: "hidden",
            position: "relative",
            maskImage: "linear-gradient(to bottom, black 50%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 50%, transparent 100%)",
          }}
        >
          {typeof routeDescription === "object" &&
          !Array.isArray(routeDescription) &&
          routeDescription.route_description_segment_html ? (
            <div
              dangerouslySetInnerHTML={{
                __html: routeDescription.route_description_segment_html,
              }}
              style={{ lineHeight: 1.5 }}
            />
          ) : Array.isArray(routeDescription) && routeDescription.length > 0 ? (
            <Stack gap="xs">
              {routeDescription.map((section) => (
                <div
                  key={`route-section-${section.section_title || section.section_content?.substring(0, 20)}`}
                >
                  {section.section_title && (
                    <Text fw={500} size="sm">
                      {section.section_title}
                    </Text>
                  )}
                  {section.section_content && (
                    <Text size="sm">{section.section_content}</Text>
                  )}
                </div>
              ))}
            </Stack>
          ) : (
            <Text size="sm" c="dimmed">
              Route description not available
            </Text>
          )}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "100%",
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,1) 100%)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <Text
            size="sm"
            c="dimmed"
            ta="center"
            p="md"
            style={{
              backgroundColor: "rgba(255,255,255,0.9)",
              borderRadius: 8,
              width: "100%",
            }}
          >
            Route descriptions available soon for Leaders
          </Text>
        </div>
      </div>
    </Stack>
  );
}
