import { Card, Image, Stack, Text, Title, Flex } from "@mantine/core";

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
    <Card withBorder p="lg" radius="md" mt="md">
      <Title order={2} mb="md">
        Where we'll be staying
      </Title>

      <Flex gap="xl" direction={{ base: 'column', md: 'row' }}>
        {photo && (
          <Image
            src={photo}
            alt={`Accommodation at ${location}`}
            radius="md"
            width={300}
            height={225}
            style={{ 
              border: '1px solid #e9ecef',
              borderRadius: 8,
              flexShrink: 0
            }}
          />
        )}

        <Stack gap="sm">
          <Text size="lg" fw={500}>
            {location}
          </Text>

          {facilities && (
            <Text size="sm" style={{ whiteSpace: 'pre-line' }}>
              {facilities}
            </Text>
          )}
        </Stack>
      </Flex>
    </Card>
  );
}
