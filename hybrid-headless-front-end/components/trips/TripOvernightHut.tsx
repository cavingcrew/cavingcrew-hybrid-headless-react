import { Paper, Image, Stack, Text, Title, Box } from "@mantine/core";

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
    <Paper withBorder p="md" radius="md" mt="md">
      <Title order={2} mb="md">Accommodation Details</Title>
      
      {photo && (
        <Image
          src={photo}
          alt={`Accommodation at ${location}`}
          radius="md"
          mb="md"
        />
      )}

      {description && (
        <Text mb="md" dangerouslySetInnerHTML={{ __html: description }} />
      )}

      {facilities && (
        <Box>
          <Title order={3} mb="sm">Cottage Facilities</Title>
          <div dangerouslySetInnerHTML={{ __html: facilities }} />
        </Box>
      )}
    </Paper>
  );
}
