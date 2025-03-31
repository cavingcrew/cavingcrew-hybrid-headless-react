"use client";

import { Carousel } from "@mantine/carousel";
import { Alert, Group, Image, Stack, Text, ThemeIcon } from "@mantine/core";
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
    <Stack gap="md">
      <Group gap="xs">
        <ThemeIcon variant="light" color="green">
          <IconMapPin size={18} />
        </ThemeIcon>
        <Text fw={500}>Route Description</Text>
      </Group>

      <div style={{ position: "relative" }}>
        {!hasPurchased && (
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(255,255,255,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            borderRadius: 8
          }}>
            <Alert color="blue" icon={<IconLock size={16} />}>
              Sign up to view full route details
            </Alert>
          </div>
        )}
        
        <div style={{
          overflow: "hidden",
          position: "relative",
          ...(!hasPurchased && {
            maxHeight: 200,
            filter: "blur(3px)",
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
      </div>
    </Stack>
  );
}
