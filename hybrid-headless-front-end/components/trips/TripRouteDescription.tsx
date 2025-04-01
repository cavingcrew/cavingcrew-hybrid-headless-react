"use client";

import { Alert, Box, Button, Group, Image, Modal, Stack, Text, ThemeIcon } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconLink, IconLock, IconMapPin } from "@tabler/icons-react";
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
  surveyImage?: Route["acf"]["route_survey_image"] | null;
  surveyLink?: string;
}

export function TripRouteDescription({ 
  routeDescription,
  hasPurchased,
  surveyImage,
  surveyLink
}: TripRouteDescriptionProps) {
  const [surveyModalOpened, { open: openSurveyModal, close: closeSurveyModal }] = useDisclosure(false);
  // Convert to array if not already
  const segments: RouteDescriptionSegment[] = Array.isArray(routeDescription) 
    ? routeDescription 
    : routeDescription && typeof routeDescription === 'object' 
      ? Object.values(routeDescription).filter(Boolean as unknown as (value: unknown) => value is RouteDescriptionSegment)
      : [];

  const visibleSegments = hasPurchased ? segments : segments.slice(0, 1);

  if (segments.length === 0 && !surveyImage) return null;

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

      {/* Survey Section */}
      {hasPurchased && surveyImage && (
        <Box>
          <Text fw={600} size="lg" mb="md">
            Cave Survey
          </Text>
          <Box 
            onClick={openSurveyModal} 
            style={{ cursor: 'pointer', position: 'relative' }}
          >
            <Image
              src={surveyImage.ID?.url || surveyImage.url || (surveyImage.sizes?.large?.file || surveyImage.sizes?.medium?.file)}
              alt={surveyImage.ID?.alt || surveyImage.alt || "Cave survey diagram"}
              radius="sm"
              mb="md"
              style={{ 
                border: '2px solid var(--mantine-color-gray-3)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
            <Box
              style={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: 4,
                fontSize: 14
              }}
            >
              Click to enlarge
            </Box>
          </Box>

          <Modal 
            opened={surveyModalOpened} 
            onClose={closeSurveyModal} 
            size="xl"
            title="Cave Survey Diagram"
          >
            <Image
              src={surveyImage.ID?.url || surveyImage.url || (surveyImage.sizes?.large?.file || surveyImage.sizes?.medium?.file)}
              alt={surveyImage.ID?.alt || surveyImage.alt || "Cave survey diagram"}
              style={{ width: '100%', height: 'auto' }}
            />
          </Modal>

          {surveyLink && (
            <Button
              component="a"
              href={surveyLink}
              target="_blank"
              variant="outline"
              leftSection={<IconLink size={16} />}
            >
              View Full Survey Document
            </Button>
          )}
        </Box>
      )}


      {visibleSegments.map((segment, index) => {
        const title = segment.title || segment.route_description_segment_title || "";
        const content = segment.content || segment.route_description_segment_html || "";
        const image = segment.image || segment.route_description_segment_photo;
        
        // Ensure image is properly formatted
        const imageUrl = image?.url || (image && typeof image === 'object' && 'ID' in image ? image.url : null);

        return (
          <Box key={`segment-${index}`}>
            <Text fw={600} size="lg" mb="md">
              {index + 1}. {title}
            </Text>

            <Box
              style={{
                display: "grid",
                gridTemplateColumns: imageUrl ? "1fr 1fr" : "1fr",
                gap: "2rem",
                alignItems: "center", // Add vertical centering
                minHeight: "300px", // Ensure minimum height for better alignment
              }}
            >
              <div
                dangerouslySetInnerHTML={{ __html: content }}
                style={{ 
                  lineHeight: 1.6,
                  padding: "1rem",
                  // Add background and border for better separation
                  backgroundColor: "var(--mantine-color-gray-0)",
                  borderRadius: "var(--mantine-radius-md)",
                }}
              />

              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt={image?.alt || `Route section ${index + 1}`}
                  radius="md"
                  style={{
                    height: "100%",
                    maxHeight: "400px",
                    objectFit: "cover",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)", // Add subtle shadow
                    border: "1px solid var(--mantine-color-gray-3)",
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
