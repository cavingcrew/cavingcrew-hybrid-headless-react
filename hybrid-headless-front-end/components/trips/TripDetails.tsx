'use client';

import { 
  Container,
  Title,
  Text,
  Stack,
  Group,
  Badge,
  Paper,
  List,
  Accordion,
  Button,
  Divider,
  Grid
} from '@mantine/core';
import { IconCalendar, IconClock, IconMapPin, IconCoin } from '@tabler/icons-react';
import type { Trip } from '@/types/api';

interface TripDetailsProps {
  trip: Trip;
}

export function TripDetails({ trip }: TripDetailsProps) {
  return (
    <Container size="lg">
      <Stack gap="xl">
        {/* Header Section */}
        <Stack gap="md">
          <Title order={1}>{trip.name}</Title>
          <Text size="lg">{trip.description}</Text>
        </Stack>

        {/* Key Details Section */}
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Paper withBorder p="md" radius="md">
              <Stack gap="md">
                <Group gap="xs">
                  <IconCalendar size={20} />
                  <Text>When: {trip.date}</Text>
                </Group>
                <Group gap="xs">
                  <IconClock size={20} />
                  <Text>Time: {trip.time}</Text>
                </Group>
                <Group gap="xs">
                  <IconMapPin size={20} />
                  <Text>Location: {trip.location}</Text>
                </Group>
                <Group gap="xs">
                  <IconCoin size={20} />
                  <Text>Member Price: £{trip.member_price}</Text>
                </Group>
                <Group gap="xs">
                  <IconCoin size={20} />
                  <Text>Non-Member Price: £{trip.non_member_price}</Text>
                </Group>
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper withBorder p="md" radius="md">
              <Stack gap="md">
                <Text fw={500}>Requirements</Text>
                <div>
                  <Text size="sm" fw={500}>Minimum Skills</Text>
                  <List size="sm">
                    {trip.minimum_skills.map((skill, index) => (
                      <List.Item key={index}>{skill}</List.Item>
                    ))}
                  </List>
                </div>
                <div>
                  <Text size="sm" fw={500}>Minimum Gear</Text>
                  <List size="sm">
                    {trip.minimum_gear.map((gear, index) => (
                      <List.Item key={index}>{gear}</List.Item>
                    ))}
                  </List>
                </div>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Sign Up Section */}
        <Paper withBorder p="md" radius="md">
          <Stack gap="md">
            <Title order={3}>Sign Up</Title>
            <Button size="lg" fullWidth>
              Sign Up Now
            </Button>
          </Stack>
        </Paper>

        {/* FAQ Section */}
        <Stack gap="md">
          <Title order={3}>Frequently Asked Questions</Title>
          <Accordion>
            {trip.faqs?.map((faq, index) => (
              <Accordion.Item key={index} value={`faq-${index}`}>
                <Accordion.Control>{faq.question}</Accordion.Control>
                <Accordion.Panel>{faq.answer}</Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Stack>
      </Stack>
    </Container>
  );
}
