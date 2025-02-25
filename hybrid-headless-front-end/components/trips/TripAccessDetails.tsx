"use client";

import {
  Alert,
  Button,
  Divider,
  Group,
  List,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconInfoCircle,
  IconKey,
  IconMapPin,
  IconParking,
  IconWalk,
} from "@tabler/icons-react";
import React from "react";
import type { Trip } from "../../types/api";

interface TripAccessDetailsProps {
  trip: Trip;
}

export function TripAccessDetails({ trip }: TripAccessDetailsProps) {
  const locationData = trip.route?.acf.route_entrance_location_id?.acf;
  const accessNotes = locationData?.location_access_arrangement || [];
  const parkingInstructions = locationData?.location_parking_description;
  const entranceCoords = locationData?.location_entrance_latlong;
  const parkingCoords = locationData?.location_parking_latlong;
  const routeDescription = locationData?.location_parking_entrance_route_description;
  const referenceLinks = locationData?.location_reference_links;

  // Coordinate parsing logic
  const parseCoords = (coords: any) => {
    if (!coords) return null;
    if (typeof coords === "string") return coords;
    if (coords.lat && coords.lng) return `${coords.lat},${coords.lng}`;
    return null;
  };

  const parkingLatLong = parseCoords(parkingCoords);
  const entranceLatLong = parseCoords(entranceCoords);

  return (
    <Paper withBorder p="md" radius="md" mt="md">
      <Title order={2} mb="md">Cave Access Details</Title>

      {/* Parking Section */}
      {parkingLatLong && (
        <Stack gap="sm" mb="xl">
          <Group gap="xs">
            <ThemeIcon variant="light" color="blue">
              <IconParking size={18} />
            </ThemeIcon>
            <Text fw={500}>Parking Location</Text>
          </Group>
          
          {parkingInstructions && (
            <Text size="sm" c="dimmed">{parkingInstructions}</Text>
          )}

          <Button 
            component="a"
            href={`http://maps.apple.com/?q=${parkingLatLong}`}
            target="_blank"
            leftSection={<IconMapPin size={16} />}
            variant="outline"
          >
            View Parking in Maps
          </Button>
        </Stack>
      )}

      {/* Entrance Section */}
      {entranceLatLong && (
        <Stack gap="sm" mb="xl">
          <Group gap="xs">
            <ThemeIcon variant="light" color="orange">
              <IconWalk size={18} />
            </ThemeIcon>
            <Text fw={500}>Cave Entrance</Text>
          </Group>

          <Button 
            component="a"
            href={`http://maps.apple.com/?q=${entranceLatLong}`}
            target="_blank"
            leftSection={<IconMapPin size={16} />}
            variant="outline"
          >
            View Entrance in Maps
          </Button>
        </Stack>
      )}

      {/* Access Requirements */}
      {accessNotes.length > 0 && (
        <Stack gap="sm" mb="xl">
          <Group gap="xs">
            <ThemeIcon variant="light" color="violet">
              <IconKey size={18} />
            </ThemeIcon>
            <Text fw={500}>Access Requirements</Text>
          </Group>
          
          <List spacing="xs">
            {accessNotes.map((note, index) => (
              <List.Item key={index} icon={<IconInfoCircle size={16} />}>
                {note}
              </List.Item>
            ))}
          </List>
        </Stack>
      )}

      {/* Route Description with Fade-out */}
      {routeDescription && (
        <div style={{ 
          position: 'relative',
          maxHeight: 200,
          overflow: 'hidden',
          maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)'
        }}>
          <Text size="sm" mb="md">
            {routeDescription}
          </Text>
          
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            textAlign: 'center',
            padding: '20px 0',
            background: 'linear-gradient(to bottom, transparent, white 70%)'
          }}>
            <Button 
              variant="light" 
              component="a" 
              href={locationData?.location_access_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Full Access Details
            </Button>
          </div>
        </div>
      )}

      {/* Reference Links */}
      {referenceLinks && referenceLinks.length > 0 && (
        <Paper withBorder p="md" radius="md" mt="md">
          <Text fw={500} mb="sm">More Information:</Text>
          <List spacing="xs">
            {referenceLinks.map((link, index) => (
              <List.Item key={index}>
                <a 
                  href={link.link_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <Text c="blue">{link.link_title}</Text>
                </a>
              </List.Item>
            ))}
          </List>
        </Paper>
      )}
    </Paper>
  );
}
