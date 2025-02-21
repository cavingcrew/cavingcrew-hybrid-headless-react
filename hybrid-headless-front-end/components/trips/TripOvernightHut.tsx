import { Grid, Image, Stack, Text, Title, Box } from "@mantine/core";

interface TripOvernightHutProps {
  location?: string;
  description?: string;
  facilities?: string;
  photo?: string;
}

export function TripOvernightHut({ 
  location,
  description,
  facilities,
  photo
}: TripOvernightHutProps) {
  return (
    <Box mt="md">
      <Title order={2} mb="md" className="ct-headline">Where we'll be staying</Title>
      
      <Grid gutter="xl">
        {photo && (
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Image
              src={photo}
              alt={`Accommodation at ${location}`}
              radius="md"
              width={300}
              height={225}
              style={{ 
                border: '1px solid #e9ecef',
                borderRadius: 8,
                maxWidth: 300
              }}
            />
          </Grid.Col>
        )}

        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="md">
            {description && (
              <Text size="md" component="div" className="ct-text-block">
                <div dangerouslySetInnerHTML={{ __html: description }} />
              </Text>
            )}

            {facilities && (
              <Box mt="sm" className="ct-div-block">
                <Text size="md" component="div">
                  <div dangerouslySetInnerHTML={{ __html: facilities }} />
                </Text>
              </Box>
            )}
          </Stack>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
