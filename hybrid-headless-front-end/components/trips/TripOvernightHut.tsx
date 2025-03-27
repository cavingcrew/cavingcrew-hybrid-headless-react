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
  const hutImage = hut?.hut_image ? hut.hut_image : photo;
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
              src={
                (typeof hutImage === 'object' && hutImage.sizes?.medium_large?.file) || 
                (typeof hutImage === 'object' && hutImage.sizes?.large?.file) || 
                (typeof hutImage === 'object' && hutImage.url) || 
                (typeof hutImage === 'string' ? hutImage : '')
              }
              alt={typeof hutImage === 'object' && 'alt' in hutImage ? hutImage.alt : `Accommodation at ${hutName}`}
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

              {/* Location details for non-signed-up users */}
              {!hasPurchased && (
                <>
                  {vagueLocation && (
                    <Text size="sm" c="dimmed" mb="xs">
                      Location: {vagueLocation}
                    </Text>
                  )}
                  {hut?.hut_location?.post_title && (
                    <Text size="sm" c="dimmed" mb="xs">
                      Region: {hut.hut_location.post_title}
                    </Text>
                  )}
                </>
              )}

              {/* Managed by - shown to members/signed-up users */}
              {(isMember || hasPurchased) && hut?.hut_club_name && (
                <Text size="sm" c="dimmed" mb="md">
                  Managed by: {hut.hut_club_name}
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

            {hut && !hasPurchased && (
              <Alert variant="light" color="blue" icon={<IconInfoCircle size={16} />}>
                Sign up for this trip to view exact location details and arrival information
              </Alert>
            )}
          </Stack>
        </Grid.Col>
      </Grid>
    </Paper>
  );
}
