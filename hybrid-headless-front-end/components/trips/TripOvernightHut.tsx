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
  IconHome
} from "@tabler/icons-react";
import { HutFacilities } from './HutFacilities';
import { useUser } from "../../lib/hooks/useUser";
import type { Trip } from "../../types/api";

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

    // Try to find the town/city - typically second to last element before postcode
    if (parts.length >= 2) {
      // Skip potential postcode (last element if it matches postcode format)
      const postcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}$/i;
      const hasPostcode = postcodeRegex.test(parts[parts.length - 1]);
      
      // Get the element before potential postcode
      const townIndex = hasPostcode ? parts.length - 2 : parts.length - 1;
      return parts[townIndex];
    }
    
    return null;
  };

  // Get vague location details
  const vagueLocation = hut?.hut_location?.post_title || 
                      getVagueLocation(hut?.hut_address) || 
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
                  <IconBuildingCommunity size={20} />
                  <Text fw={500}>Club Information</Text>
                  <Badge variant="light">Members Only</Badge>
                </Group>
                <List>
                  {hut.hut_club_name && (
                    <List.Item>Club: {hut.hut_club_name}</List.Item>
                  )}
                  {hut.hut_location?.post_title && (
                    <List.Item>Region: {hut.hut_location.post_title}</List.Item>
                  )}
                  {hut.hut_address && (
                    <List.Item>
                      Address: {hut.hut_address}
                      {hut.hut_lat_long && (
                        <Button
                          variant="subtle"
                          size="xs"
                          component="a"
                          href={`http://maps.apple.com/?q=${hut.hut_lat_long}`}
                          target="_blank"
                          leftSection={<IconMapPin size={14} />}
                          ml="xs"
                        >
                          View Map
                        </Button>
                      )}
                    </List.Item>
                  )}
                </List>
              </Paper>
            )}

            {/* Signed-up Participants Information */}
            {hasPurchased && hut && (
              <Paper withBorder p="md" bg="var(--mantine-color-green-light)">
                <Group gap="xs" mb="sm">
                  <IconKey size={20} />
                  <Text fw={500}>Access Details</Text>
                  <Badge variant="light">Participants Only</Badge>
                </Group>
                <List>
                  {hut.hut_parking_instructions && (
                    <List.Item>
                      <Group gap="xs" align="flex-start">
                        <IconParking size={18} style={{ marginTop: 3 }} />
                        <div>
                          <Text>Parking: {hut.hut_parking_instructions}</Text>
                          {hut.hut_lat_long && (
                            <Button
                              variant="subtle"
                              size="xs"
                              component="a"
                              href={`http://maps.apple.com/?q=${hut.hut_lat_long}`}
                              target="_blank"
                              leftSection={<IconMapPin size={14} />}
                              mt="xs"
                            >
                              Parking Coordinates
                            </Button>
                          )}
                        </div>
                      </Group>
                    </List.Item>
                  )}
                  {hut.hut_arrival_and_directions && (
                    <List.Item>
                      <Group gap="xs" align="flex-start">
                        <IconUsersGroup size={18} style={{ marginTop: 3 }} />
                        <Text>{hut.hut_arrival_and_directions}</Text>
                      </Group>
                    </List.Item>
                  )}
                </List>
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
