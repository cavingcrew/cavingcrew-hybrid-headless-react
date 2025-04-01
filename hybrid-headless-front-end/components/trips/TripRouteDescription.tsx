"use client";

import { Alert, Box, Button, Group, Image, Modal, Stack, Text, ThemeIcon } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconLink, IconLock, IconMapPin, IconPrinter } from "@tabler/icons-react";
import React, { useRef } from "react";
import type { Route } from "../../types/api";

export interface RouteDescriptionSegment {
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
  routeName?: string;
}

export function TripRouteDescription({ 
  routeDescription,
  hasPurchased,
  surveyImage,
  surveyLink,
  routeName
}: TripRouteDescriptionProps) {
  const [surveyModalOpened, { open: openSurveyModal, close: closeSurveyModal }] = useDisclosure(false);
  const [isExpanded, { toggle: toggleExpand }] = useDisclosure(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  // Convert to array if not already
  const segments: RouteDescriptionSegment[] = Array.isArray(routeDescription) 
    ? routeDescription 
    : routeDescription && typeof routeDescription === 'object' 
      ? Object.values(routeDescription).filter(Boolean as unknown as (value: unknown) => value is RouteDescriptionSegment)
      : [];

  const visibleSegments = hasPurchased 
    ? (isExpanded ? segments : segments.slice(0, 1))
    : segments.slice(0, 1);

  const handlePrint = () => {
    if (!printRef.current) return;
    
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Route Description - ${routeName || 'Caving Crew'}</title>
          <style>
            @media print {
              @page {
                margin: 1cm;
                size: A4;
              }
              .print-header {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                text-align: center;
                font-size: 14px;
                padding-bottom: 10px;
                border-bottom: 1px solid #000;
              }
              .print-title {
                font-size: 24px;
                margin: 1rem 0 2rem;
                font-weight: bold;
                text-align: center;
              }
              .segment-image {
                max-width: 60%;
                height: auto;
                margin: 1em auto;
                page-break-inside: avoid;
              }
              .survey-image {
                max-width: 100%;
              }
              body {
                margin-top: 20px;
                font-size: 18px;
                line-height: 1.6;
              }
              h2 {
                font-size: 22px;
                margin: 1.5em 0 0.5em;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (segments.length === 0 && !surveyImage) return null;

  return (
    <Stack gap="xl">
      {/* Hidden print content */}
      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          <div className="print-header">
            This is a Caving Crew Route Description for our Members use
          </div>
          {routeName && <div className="print-title">{routeName}</div>}
          {hasPurchased && surveyImage && (
            <div className="survey-image">
              <Text fw={600} size="lg" mb="md">
                Cave Survey
              </Text>
              <Image
                src={surveyImage.url || (surveyImage.sizes?.large?.file || surveyImage.sizes?.medium?.file)}
                alt={surveyImage.alt || "Cave survey diagram"}
                radius="sm"
                mb="md"
              />
              {surveyLink && (
                <Text component="a" href={surveyLink} target="_blank">
                  View Full Survey Document
                </Text>
              )}
            </div>
          )}
          {segments.map((segment, index) => {
            const title = segment.title || segment.route_description_segment_title || "";
            const content = segment.content || segment.route_description_segment_html || "";
            const image = segment.image || segment.route_description_segment_photo;
            const imageUrl = image?.url;

            return (
              <div key={`print-segment-${index}`}>
                <Text fw={600} size="lg" mb="md">
                  {index + 1}. {title}
                </Text>
                <div dangerouslySetInnerHTML={{ __html: content }} />
                {imageUrl && (
                  <Image
                    src={imageUrl}
                    alt={image?.alt || `Route section ${index + 1}`}
                    radius="md"
                    className="segment-image"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

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
          <Group mb="md">
            <Button
              onClick={handlePrint}
              variant="outline"
              leftSection={<IconPrinter size={16} />}
            >
              Print Route Description
            </Button>
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
          </Group>

          <Text fw={600} size="lg" mb="md">
            Cave Survey
          </Text>
          <Box 
            onClick={openSurveyModal} 
            style={{ cursor: 'pointer', position: 'relative' }}
          >
            <Image
              src={surveyImage.url || (surveyImage.sizes?.large?.file || surveyImage.sizes?.medium?.file)}
              alt={surveyImage.alt || "Cave survey diagram"}
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
              src={surveyImage.url || (surveyImage.sizes?.large?.file || surveyImage.sizes?.medium?.file)}
              alt={surveyImage.alt || "Cave survey diagram"}
              style={{ width: '100%', height: 'auto' }}
            />
          </Modal>
        </Box>
      )}

      <Box style={{ position: 'relative' }}>
        {visibleSegments.map((segment, index) => {
        const title = segment.title || segment.route_description_segment_title || "";
        const content = segment.content || segment.route_description_segment_html || "";
        const image = segment.image || segment.route_description_segment_photo;
        
        // Ensure image is properly formatted
        const imageUrl = image?.url;

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
                alignItems: "center",
                minHeight: "300px",
              }}
            >
              <div
                dangerouslySetInnerHTML={{ __html: content }}
                style={{ 
                  lineHeight: 1.6,
                  padding: "1rem",
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
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    border: "1px solid var(--mantine-color-gray-3)",
                  }}
                />
              )}
            </Box>
          </Box>
        );
      })}
      </Box>

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
      
      {segments.length > 1 && hasPurchased && (
        <Box style={{ position: 'relative' }}>
          {!isExpanded && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '100px',
                marginTop: '-100px',
                background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,1) 100%)',
                pointerEvents: 'none',
                zIndex: 1
              }}
            />
          )}
          
          <Button
            fullWidth
            variant="outline"
            onClick={toggleExpand}
            mt="md"
            style={{ position: 'relative', zIndex: 2 }}
          >
            {isExpanded ? 'Show less' : 'Read full route description'}
          </Button>
        </Box>
      )}
    </Stack>
  );
}
