"use client";

import {
  Paper,
  Grid,
  Image,
  Stack,
  Text,
  Title,
  Box,
  Group,
  Badge,
  List,
  ThemeIcon,
  Alert,
  Button
} from "@mantine/core";
import {
  IconMapPin,
  IconBuildingCommunity,
  IconKey,
  IconParking,
  IconInfoCircle,
  IconUsersGroup,
  IconPaw,
  IconMapPinFilled,
  IconHome,
  IconWalk
} from "@tabler/icons-react";
import { HutFacilities } from './HutFacilities';
import { useUser } from "../../lib/hooks/useUser";
import type { Trip } from "../../types/api";

function ArrivalInfo({ hut }: { hut: Trip["hut"] }) {
  if (!hut) return null;

  return (
    <Paper withBorder p="md" bg="var(--mantine-color-green-light)" mb="md">
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
            <ThemeIcon variant="light" color="blue" size="md">
              <IconWalk size={16} />
            </ThemeIcon>
            <Text>{hut.hut_arrival_and_directions}</Text>
          </Group>
        )}
      </Stack>
    </Paper>
  );
}

interface TripOvernightHutProps {
  hut?: Trip["hut"];
  tripId?: number;
  location?: string;
  facilities?: string;
  photo?: string;
}


export function TripOvernightHut({ 
  hut, 
  tripId, 
  location, 
  facilities, 
  photo 
}: TripOvernightHutProps) {
  const { isLoggedIn, isMember, purchasedProducts } = useUser();
  const hasPurchased = tripId ? purchasedProducts.includes(tripId) : false;

  // Support both new hut object and legacy props
  const hutName = hut?.hut_name || location || "Accommodation";
  const hutImage = hut?.hut_image?.url || photo;
  const hutDescription = hut?.hut_sales_description || facilities;
  
  // Helper function to extract locality from address
  const getVagueLocation = (address?: string) => {
    if (!address) return null;
    
    // Split address by commas and clean up
    const parts = address.split(',')
      .map(part => part.trim())
      .filter(part => part.length > 0);

    // Common county names to ignore
    const counties = [
      'derbyshire', 'yorkshire', 'cumbria', 'mid wales', 'wales',
      'somerset', 'devon', 'cornwall', 'north wales', 'south wales'
    ].map(c => c.toLowerCase());

    // Look for locality candidates
    const localityCandidates = parts
      .reverse() // Check from last part backwards
      .filter(part => 
        !counties.includes(part.toLowerCase()) && 
        !/\d/.test(part) && // Skip parts with numbers
        part.toLowerCase() !== 'uk');

    // Get first valid candidate
    return localityCandidates.find(part => part.length > 3 && part.match(/[a-z]/i)) || null;
  };

  // Get vague location details
  const vagueLocation = getVagueLocation(hut?.hut_address) || 
                      hut?.hut_location?.post_title || 
                      location;

  return (
    <Paper withBorder p="md" radius="md">
      <Title order={2} mb="md">Where we'll be staying</Title>
      
      <Grid gutter="xl">
        {hutImage && (
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Image
              src={hutImage}
              alt={`Accommodation at ${hutName}`}
              radius="md"
              style={{ 
                maxWidth: '100%',
                border: '1px solid #e9ecef',
                borderRadius: 8,
              }}
            />
          </Grid.Col>
        )}

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap="lg">
            <div>
              <Title order={3} mb="sm">{hutName}</Title>
              
              {/* Vague location shown to everyone */}
              {vagueLocation && (
                <Text size="sm" c="dimmed" mb="sm">
                  Location: {vagueLocation}
                </Text>
              )}
              
              {hutDescription && (
                <Text>{hutDescription}</Text>
              )}
            </div>

            {/* Facilities Grid */}
            {hut?.hut_facilities && hut.hut_facilities.length > 0 && (
              <HutFacilities facilities={hut.hut_facilities} />
            )}

            {/* Member-only Information */}
            {isLoggedIn && isMember && hut && (
              <Paper withBorder p="md" bg="var(--mantine-color-blue-light)">
                <Group gap="xs" mb="sm">
                  <IconInfoCircle size={20} />
                  <Text fw={500}>Hut Information</Text>
                  <Badge variant="light">Members Only</Badge>
                </Group>
                
                <Stack gap="sm">
                  <Group gap="sm">
                    <ThemeIcon variant="light" color="blue" size="md">
                      <IconHome size={16} />
                    </ThemeIcon>
                    <Text>{hut.hut_name}</Text>
                  </Group>

                  {hut.hut_location?.post_title && (
                    <Group gap="sm">
                      <ThemeIcon variant="light" color="orange" size="md">
                        <IconMapPin size={16} />
                      </ThemeIcon>
                      <Text>Region: {hut.hut_location.post_title}</Text>
                    </Group>
                  )}

                  {hut.hut_club_name && (
                    <Group gap="sm">
                      <ThemeIcon variant="light" color="violet" size="md">
                        <IconBuildingCommunity size={16} />
                      </ThemeIcon>
                      <Text>Managed by: {hut.hut_club_name}</Text>
                    </Group>
                  )}
                </Stack>
              </Paper>
            )}

            {/* Signed-up Participants Information */}
            {hasPurchased && hut && <ArrivalInfo hut={hut} />}

            {/* Parking Instructions for Participants */}
            {hasPurchased && hut && hut.hut_parking_instructions && (
              <Paper withBorder p="md" bg="var(--mantine-color-green-light)">
                <Group gap="xs" mb="sm">
                  <IconParking size={20} />
                  <Text fw={500}>Parking Information</Text>
                  <Badge variant="light">Participants Only</Badge>
                </Group>
                
                <Group gap="sm" align="flex-start">
                  <ThemeIcon variant="light" color="green" size="md">
                    <IconParking size={16} />
                  </ThemeIcon>
                  <Text>{hut.hut_parking_instructions}</Text>
                </Group>
              </Paper>
            )}

            {/* General Information */}
            {hut && (hut.hut_dogs_allowed || hut.hut_capacity) && (
              <div>
                <Text fw={500} mb="sm">Additional Information</Text>
                <List>
                  {hut.hut_dogs_allowed && (
                    <List.Item icon={
                      <ThemeIcon color="blue" variant="light" size="sm">
                        <IconPaw size={14} />
                      </ThemeIcon>
                    }>
                      Dogs allowed: {hut.hut_dogs_allowed === 'yes' ? 'Yes' : 'No'}
                    </List.Item>
                  )}
                  {hut.hut_capacity && (
                    <List.Item icon={
                      <ThemeIcon color="blue" variant="light" size="sm">
                        <IconUsersGroup size={14} />
                      </ThemeIcon>
                    }>
                      Capacity: {hut.hut_capacity} people
                    </List.Item>
                  )}
                </List>
              </div>
            )}

            {hut && !isLoggedIn && (
              <Alert variant="light" color="blue" icon={<IconInfoCircle size={16} />}>
                Sign up or log in to view member-only details like exact location
                and club information
              </Alert>
            )}
          </Stack>
        </Grid.Col>
      </Grid>
    </Paper>
  );
}
