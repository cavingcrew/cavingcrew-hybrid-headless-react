'use client';


import { Paper, Grid, Image, Stack, Text, Title, Box } from "@mantine/core";

interface TripOvernightHutProps {
  location?: string;
  facilities?: string;
  photo?: string;
}

export function TripOvernightHut({
  location,
  facilities,
  photo
}: TripOvernightHutProps) {
  return (
      <Paper withBorder p="md" radius="md">

      <Box mt="md">
      <Title order={2} mb="md">Where we'll be staying</Title>

      <Grid gutter="xl">
        {photo && (
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Image
              src={photo}
              alt={`Accommodation at ${location}`}
              radius="md"
              width={300}
              height={200}
              style={{
                maxWidth: 300,
                border: '1px solid #e9ecef',
                borderRadius: 8,
              }}
            />
          </Grid.Col>
        )}

        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="sm">


            {facilities && (
              <Text>
                {facilities}
              </Text>
            )}
          </Stack>
        </Grid.Col>
      </Grid>
    </Box>
      </Paper>
  );
}
