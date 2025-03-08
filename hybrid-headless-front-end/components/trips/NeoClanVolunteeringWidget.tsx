'use client';

import { useState } from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Badge,
  Tabs,
  Table,
  Skeleton,
  Alert,
  Stack,
  Divider
} from '@mantine/core';
import { IconUsers, IconAlertCircle, IconInfoCircle } from '@tabler/icons-react';
import { useTripParticipants, type TripParticipant } from '@/lib/hooks/useTripParticipants';
import type { Trip } from '@/types/api';

interface NeoClanVolunteeringWidgetProps {
  trip: Trip;
}

export function NeoClanVolunteeringWidget({ trip }: NeoClanVolunteeringWidgetProps) {
  const [activeTab, setActiveTab] = useState<string | null>('participants');
  const { data, isLoading, error } = useTripParticipants(trip.id);

  const participants = data?.data?.participants || [];
  const accessLevel = data?.data?.access_level || 'public';

  if (isLoading) {
    return (
      <Paper withBorder p="md" radius="md">
        <Stack>
          <Group justify="space-between">
            <Title order={3}>Trip Participants</Title>
            <Skeleton height={24} width={100} radius="xl" />
          </Group>
          <Skeleton height={200} radius="md" />
        </Stack>
      </Paper>
    );
  }

  if (error || !data?.success) {
    return (
      <Paper withBorder p="md" radius="md">
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          Failed to load participant information. Please try again later.
        </Alert>
      </Paper>
    );
  }

  // Public access view - just show first names
  if (accessLevel === 'public') {
    return (
      <Paper withBorder p="md" radius="md">
        <Title order={3} mb="md">Who's Coming</Title>

        {participants.length === 0 ? (
          <Text c="dimmed">No one has signed up yet. Be the first!</Text>
        ) : (
          <>
            <Group gap="xs" mb="xs">
              <Badge color="blue">{participants.length} people signed up</Badge>
            </Group>

            <Group gap="xs">
              {participants.map((participant, index) => (
                <Badge key={index} variant="outline">
                  {participant.first_name}
                </Badge>
              ))}
            </Group>
          </>
        )}
      </Paper>
    );
  }

  // Participant access view - show more details
  if (accessLevel === 'participant') {
    return (
      <Paper withBorder p="md" radius="md">
        <Title order={3} mb="md">People confirmed for this trip</Title>

        {participants.length === 0 ? (
          <Text c="dimmed">No one has signed up yet. Be the first!</Text>
        ) : (
          <>
            <Group gap="xs" mb="md">
              <Badge color="blue">{participants.length} people signed up</Badge>
            </Group>

            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Caving Skills</Table.Th>
                  <Table.Th>Volunteer Role</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {participants.map((participant) => (
                  <Table.Tr key={participant.order_id}>
                    <Table.Td>{participant.first_name} {participant.last_name}</Table.Td>
                    <Table.Td>{participant.meta?.['skills-horizontal'] || 'Not specified'}</Table.Td>
                    <Table.Td>
                      {participant.order_meta?.cc_volunteer &&
                       participant.order_meta.cc_volunteer !== 'none' &&
                       participant.order_meta.cc_volunteer !== '' ? (
                        <Badge color="green">
                          {participant.order_meta.cc_volunteer}
                        </Badge>
                      ) : 'None'}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </>
        )}
      </Paper>
    );
  }

  // Admin access view - show tabs with different information
  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between" mb="md">
        <Title order={3}>Trip Management</Title>
        <Badge color="blue" size="lg">Admin Access</Badge>
        <Text>Just to state the obvious, people who are't you, can't see all this info</Text>
      </Group>

      {participants.length === 0 ? (
        <Alert icon={<IconInfoCircle size={16} />} color="blue">
          No participants have signed up for this trip yet.
        </Alert>
      ) : (
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="participants" leftSection={<IconUsers size={14} />}>
              Participants
            </Tabs.Tab>
            <Tabs.Tab value="dietary">Dietary Requirements</Tabs.Tab>
            <Tabs.Tab value="transport">Transport</Tabs.Tab>
            <Tabs.Tab value="skills">Skills & Equipment</Tabs.Tab>
            <Tabs.Tab value="admin">Admin Info</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="participants" pt="xs">
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Volunteer Role</Table.Th>
                  <Table.Th>Order ID</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {participants.map((participant) => (
                  <Table.Tr key={participant.order_id}>
                    <Table.Td>{participant.first_name} {participant.last_name}</Table.Td>
                    <Table.Td>
                      <Badge
                        color={
                          participant.order_meta?.cc_attendance === 'attended' ? 'green' :
                          participant.order_meta?.cc_attendance === 'noshow' ? 'red' :
                          participant.order_meta?.cc_attendance === 'cancelled' ? 'gray' :
                          participant.order_meta?.cc_attendance === 'latebail' ? 'orange' :
                          'blue'
                        }
                      >
                        {participant.order_meta?.cc_attendance || 'pending'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {participant.order_meta?.cc_volunteer &&
                       participant.order_meta.cc_volunteer !== 'none' ? (
                        <Badge color="green">
                          {participant.order_meta.cc_volunteer}
                        </Badge>
                      ) : 'None'}
                    </Table.Td>
                    <Table.Td>{participant.order_id}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Tabs.Panel>

          <Tabs.Panel value="dietary" pt="xs">
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Dietary Requirements</Table.Th>
                  <Table.Th>Diet and Health Details</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {participants.map((participant) => (
                  <Table.Tr key={participant.order_id}>
                    <Table.Td>{participant.first_name} {participant.last_name}</Table.Td>
                    <Table.Td>{participant.meta?.['admin-dietary-requirements'] || 'Not specified'}</Table.Td>
                    <Table.Td>{participant.admin_meta?.['admin-diet-allergies-health-extra-info'] || 'None'}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Tabs.Panel>

          <Tabs.Panel value="transport" pt="xs">
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Needs Lift</Table.Th>
                  <Table.Th>Offering Lift</Table.Th>
                  <Table.Th>Leaving From</Table.Th>
                  <Table.Th>Departure Time</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {participants.map((participant) => (
                  <Table.Tr key={participant.order_id}>
                    <Table.Td>{participant.first_name} {participant.last_name}</Table.Td>
                    <Table.Td>{participant.meta?.['transport-need-lift'] === 'yes' ? 'Yes' : 'No'}</Table.Td>
                    <Table.Td>{participant.meta?.['transport-will-you-give-lift'] === 'yes' ? 'Yes' : 'No'}</Table.Td>
                    <Table.Td>{participant.meta?.['transport-leaving-location'] || participant.meta?.['caving_trip_leaving_postcode'] || 'Not specified'}</Table.Td>
                    <Table.Td>{participant.meta?.['transport-depature-time'] || 'Not specified'}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Tabs.Panel>

          <Tabs.Panel value="skills" pt="xs">
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Horizontal Skills</Table.Th>
                  <Table.Th>SRT Skills</Table.Th>
                  <Table.Th>Lead/Second</Table.Th>
                  <Table.Th>Kit Bringing</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {participants.map((participant) => (
                  <Table.Tr key={participant.order_id}>
                    <Table.Td>{participant.first_name} {participant.last_name}</Table.Td>
                    <Table.Td>{participant.meta?.['skills-horizontal'] || 'Not specified'}</Table.Td>
                    <Table.Td>{participant.meta?.['skills-srt'] || 'Not specified'}</Table.Td>
                    <Table.Td>
                      {participant.meta?.['caving-horizontal-happy-to-second-or-lead'] ||
                       participant.meta?.['caving-srt-happy-to-second-or-lead'] ||
                       'Not specified'}
                    </Table.Td>
                    <Table.Td>{participant.meta?.['gear-bringing-evening-or-day-trip'] || 'None'}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Tabs.Panel>

          <Tabs.Panel value="admin" pt="xs">
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>First Timer</Table.Th>
                  <Table.Th>Order ID</Table.Th>
                  <Table.Th>Emergency Contact</Table.Th>
                  <Table.Th>Phone</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {participants.map((participant) => (
                  <Table.Tr key={participant.order_id}>
                    <Table.Td>{participant.first_name} {participant.last_name}</Table.Td>
                    <Table.Td>{participant.admin_meta?.['admin-first-timer-question'] === 'yes' ? 'Yes' : 'No'}</Table.Td>
                    <Table.Td>{participant.order_id}</Table.Td>
                    <Table.Td>
                      {participant.admin_meta?.['admin-emergency-contact-name'] || 'Not provided'}
                      {participant.admin_meta?.['admin-emergency-contact-phone'] ?
                        ` (${participant.admin_meta['admin-emergency-contact-phone']})` : ''}
                    </Table.Td>
                    <Table.Td>{participant.admin_meta?.['admin-phone-number'] || participant.admin_meta?.['billing_phone'] || 'Not provided'}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Tabs.Panel>
        </Tabs>
      )}
    </Paper>
  );
}
