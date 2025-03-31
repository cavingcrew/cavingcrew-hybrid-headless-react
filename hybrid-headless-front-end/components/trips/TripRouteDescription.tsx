"use client";

import { Carousel } from "@mantine/carousel";
import { Group, Image, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconMapPin } from "@tabler/icons-react";
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

  // Extract images from HTML content
  const extractImages = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return Array.from(doc.images).map(img => ({
      src: img.src,
      alt: img.alt,
    }));
  };

  return (
    <Stack gap="md" mb="xl">
      <Group gap="xs">
        <ThemeIcon variant="light" color="green">
          <IconMapPin size={18} />
        </ThemeIcon>
        <Text fw={500}>Route Description</Text>
      </Group>

      <div style={{ position: "relative" }}>
        <div style={{
          overflow: "hidden",
          position: "relative",
          ...(!hasPurchased && {
            maxHeight: 200,
            maskImage: "linear-gradient(to bottom, black 50%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 50%, transparent 100%)"
          })
        }}>
          {typeof routeDescription === "object" &&
          !Array.isArray(routeDescription) &&
          routeDescription.route_description_segment_html ? (
            <div style={{ lineHeight: 1.5 }}>
              <div
                dangerouslySetInnerHTML={{
                  __html: routeDescription.route_description_segment_html,
                }}
              />
              {hasPurchased && extractImages(routeDescription.route_description_segment_html).length > 0 && (
                <Carousel
                  slideSize="70%"
                  height={300}
                  slideGap="md"
                  controlsOffset="xs"
                  dragFree
                  withIndicators
                  mt="md"
                >
                  {extractImages(routeDescription.route_description_segment_html).map((img, i) => (
                    <Carousel.Slide key={i}>
                      <Image
                        src={img.src}
                        alt={img.alt || `Route image ${i + 1}`}
                        height={300}
                        style={{ objectFit: "cover" }}
                      />
                    </Carousel.Slide>
                  ))}
                </Carousel>
              )}
            </div>
          ) : Array.isArray(routeDescription) && routeDescription.length > 0 ? (
            <Stack gap="xl">
              {routeDescription.map((section) => (
                <div key={`route-section-${section.section_title || section.section_content?.substring(0, 20)}`}>
                  {section.section_title && (
                    <Text fw={500} size="lg" mb="sm">
                      {section.section_title}
                    </Text>
                  )}
                  {section.section_content && (
                    <>
                      <div
                        dangerouslySetInnerHTML={{ __html: section.section_content }}
                        style={{ lineHeight: 1.6 }}
                      />
                      {hasPurchased && extractImages(section.section_content).length > 0 && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                          gap: '1rem',
                          margin: '1rem 0'
                        }}>
                          {extractImages(section.section_content).map((img, i) => (
                            <Image
                              key={i}
                              src={img.src}
                              alt={img.alt || `Section image ${i + 1}`}
                              radius="sm"
                              style={{ height: 200, objectFit: 'cover' }}
                            />
                          ))}
                        </div>
                      )}
                    </>
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

        {!hasPurchased && (
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "100%",
            background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,1) 100%)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            pointerEvents: "none",
          }}>
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
              Sign up to view full route details including maps and photos
            </Text>
          </div>
        )}
      </div>
    </Stack>
  );
}
