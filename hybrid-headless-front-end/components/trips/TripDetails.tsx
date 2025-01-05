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
  Grid,
  Button,
  Image,
} from '@mantine/core';
import { IconCalendar, IconClock, IconMapPin, IconCoin } from '@tabler/icons-react';
import type { Trip } from '../../types/api';
import { Fragment } from 'react';

interface TripDetailsProps {
  trip: Trip;
}

export function TripDetails({ trip }: TripDetailsProps) {
  const startDate = trip.acf.event_start_date_time ? 
    new Date(trip.acf.event_start_date_time) : null;

  return (
    <Stack gap="xl">
      {/* Header Section */}
      <Stack gap="md">
        <Title order={1}>{trip.name}</Title>
        {trip.acf.event_description && (
          <div 
            dangerouslySetInnerHTML={{ 
              __html: trip.acf.event_description 
            }} 
          />
        )}
      </Stack>

      {/* Key Details Section */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper withBorder p="md" radius="md">
            <Stack gap="md">
              {startDate && (
                <Group gap="xs">
                  <IconCalendar size={20} />
                  <Text>When: {startDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
                </Group>
              )}
              {startDate && (
                <Group gap="xs">
                  <IconClock size={20} />
                  <Text>Time: from {startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</Text>
                </Group>
              )}
              {trip.acf.event_location && (
                <Group gap="xs">
                  <IconMapPin size={20} />
                  <Text>Location: {trip.acf.event_cave_name} near {trip.acf.event_possible_location}</Text>
                </Group>
              )}
              <Group gap="xs">
                <IconCoin size={20} />
                <Text>Member Price: £{trip.acf.event_cost}</Text>
              </Group>
              <Group gap="xs">
                <IconCoin size={20} />
                <Text>Non-Member Price: £{trip.price}</Text>
              </Group>
            </Stack>
          </Paper>

          {/* Requirements Section */}
          {(trip.acf.event_skills_required || trip.acf.event_gear_required) && (
            <Paper withBorder p="md" radius="md" mt="md">
              <Stack gap="md">
                <Text fw={500}>Requirements</Text>
                {trip.acf.event_skills_required && (
                  <div>
                    <Text size="sm" fw={500}>Minimum Skills</Text>
                    <Text>{trip.acf.event_skills_required}</Text>
                  </div>
                )}
                {trip.acf.event_gear_required && (
                  <div>
                    <Text size="sm" fw={500}>Minimum Gear</Text>
                    <Text>{trip.acf.event_gear_required}</Text>
                  </div>
                )}
              </Stack>
            </Paper>
          )}
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          {trip.images?.[0] && (
            <Image
              src={trip.images[0].src}
              alt={trip.images[0].alt}
              radius="md"
            />
          )}
        </Grid.Col>
      </Grid>

      {/* What does signing up pay for section */}
      {trip.acf.event_paying_for && (
        <Paper withBorder p="md" radius="md">
          <Title order={2} mb="md">What does signing up pay for?</Title>
          <div 
            dangerouslySetInnerHTML={{ 
              __html: trip.acf.event_paying_for 
            }} 
          />
        </Paper>
      )}

      {/* FAQ Section */}
      {trip.acf.trip_faq && trip.acf.trip_faq.length > 0 && (
        <Paper withBorder p="md" radius="md">
          <Title order={2} mb="md">Q&A</Title>
          <Accordion>
            {trip.acf.trip_faq.map((faq, index) => (
              <Accordion.Item key={index} value={`faq-${index}`}>
                <Accordion.Control>{faq.trip_faq_title}</Accordion.Control>
                <Accordion.Panel>
                  {faq.trip_faq_answer && (
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: faq.trip_faq_answer 
                      }} 
                    />
                  )}
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Paper>
      )}

      {/* Kit List Section */}
      {trip.acf.overnight_kitlist && trip.acf.overnight_kitlist.length > 0 && (
        <Paper withBorder p="md" radius="md">
          <Title order={2} mb="md">Kit List</Title>
          <Accordion>
            {trip.acf.overnight_kitlist.map((kit, index) => (
              <Accordion.Item key={index} value={`kit-${index}`}>
                <Accordion.Control>{kit.overnight_kit_list_type}</Accordion.Control>
                <Accordion.Panel>
                  {kit.overnight_kit_list && (
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: kit.overnight_kit_list 
                      }} 
                    />
                  )}
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Paper>
      )}

      {/* Plans Section */}
      {trip.acf.overnight_plans && trip.acf.overnight_plans.length > 0 && (
        <Paper withBorder p="md" radius="md">
          <Title order={2} mb="md">Plans</Title>
          <Text mb="md">Times are all subject to change, and are mainly for illustration and to start conversation.</Text>
          <Accordion>
            {trip.acf.overnight_plans.map((plan, index) => (
              <Accordion.Item key={index} value={`plan-${index}`}>
                <Accordion.Control>{plan.overnight_plans_day}</Accordion.Control>
                <Accordion.Panel>
                  {plan.overnight_plans_description && (
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: plan.overnight_plans_description 
                      }} 
                    />
                  )}
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Paper>
      )}
    </Stack>
  );
}
