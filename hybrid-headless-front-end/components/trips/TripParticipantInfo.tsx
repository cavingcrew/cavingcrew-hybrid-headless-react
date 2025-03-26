"use client";

import {
  Paper,
  Group,
  Text,
  ThemeIcon,
  Badge,
  Button,
  Stack,
  Alert
} from "@mantine/core";
import {
  IconMapPinFilled,
  IconHome,
  IconWalk,
  IconParking,
  IconInfoCircle
} from "@tabler/icons-react";
import { useUser } from "../../lib/hooks/useUser";
import type { Trip } from "../../types/api";

interface TripParticipantInfoProps {
  hut?: Trip["hut"];
  tripId?: number;
}

export function TripParticipantInfo({ hut, tripId }: TripParticipantInfoProps) {
  const { purchasedProducts } = useUser();
  const hasPurchased = tripId ? purchasedProducts.includes(tripId) : false;

  if (!hasPurchased || !hut) return null;

  return (
    <Stack gap="md">
      {/* Arrival Information */}
      <Paper withBorder p="md" bg="var(--mantine-color-green-light)">
        <Group gap="xs" mb="sm">
          <IconMapPinFilled size={20} />
          <Text fw={500}>Arrival Information</Text>
          <Badge variant="light">Participants Only</Badge>
        </Group>
        
        <Stack gap="sm">
          {hut.hut_address && (
            <Group gap="sm">
              <ThemeIcon variant="light" color="green" size="md">
                <IconHome size={16} />
              </ThemeIcon>
              <Text>{hut.hut_address}</Text>
            </Group>
          )}

          {hut.hut_lat_long && (
            <Button
              variant="filled"
              color="green"
              leftSection={<IconMapPinFilled size={16} />}
              component="a"
              href={`http://maps.apple.com/?q=${hut.hut_lat_long}`}
              target="_blank"
            >
              View Hut Location on Map
            </Button>
          )}

          {hut.hut_arrival_and_directions && (
            <Group gap="sm" align="flex-start">
              <ThemeIcon variant="light" color="blue" size="md" mt={3}>
                <IconWalk size={16} />
              </ThemeIcon>
              <Text style={{ flex: 1 }} component="div">
                <div dangerouslySetInnerHTML={{__html: hut.hut_arrival_and_directions.replace(/\n/g, '<br />')}} />
              </Text>
            </Group>
          )}
        </Stack>
      </Paper>

      {/* Parking Instructions */}
      {hut.hut_parking_instructions && (
        <Paper withBorder p="md" bg="var(--mantine-color-green-light)">
          <Group gap="xs" mb="sm">
            <IconParking size={20} />
            <Text fw={500}>Parking Information</Text>
            <Badge variant="light">Participants Only</Badge>
          </Group>
          
          <Group gap="sm" align="flex-start">
            <ThemeIcon variant="light" color="green" size="md" mt={4}>
              <IconParking size={16} />
            </ThemeIcon>
            <Text style={{ flex: 1 }} component="div">
              <div dangerouslySetInnerHTML={{__html: hut.hut_parking_instructions.replace(/\n/g, '<br />')}} />
            </Text>
          </Group>
        </Paper>
      )}

      <Alert icon={<IconInfoCircle size={16} />} color="green" variant="light">
        This information is only visible to signed-up participants. Please keep location details confidential.
      </Alert>
    </Stack>
  );
}
