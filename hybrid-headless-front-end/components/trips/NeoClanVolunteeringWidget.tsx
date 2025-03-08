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
  Button,
  Modal,
  List,
  Anchor,
  Box,
  ThemeIcon
} from '@mantine/core';
import { 
  IconUsers, 
  IconAlertCircle, 
  IconInfoCircle, 
  IconTools, 
  IconHeartHandshake, 
  IconSchool,
  IconMedicalCross,
  IconShield,
  IconChartBar,
  IconAlertTriangle,
  IconCheck,
  IconX
} from '@tabler/icons-react';
import { useTripParticipants, type TripParticipant } from '@/lib/hooks/useTripParticipants';
import type { Trip } from '@/types/api';

interface NeoClanVolunteeringWidgetProps {
  trip: Trip;
}

export function NeoClanVolunteeringWidget({ trip }: NeoClanVolunteeringWidgetProps) {
  const [activeTab, setActiveTab] = useState<string | null>('cavers');
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<TripParticipant | null>(null);
  const { data, isLoading, error } = useTripParticipants(trip.id);

  const participants = data?.data?.participants || [];
  const accessLevel = data?.data?.access_level || 'public';

  // Helper function to determine signup status
  const getSignupStatus = (participant: TripParticipant) => {
    const attendance = participant.order_meta?.cc_attendance;
    const orderStatus = participant.order_status;

    if (attendance === 'attended') return 'Attended';
    if (attendance === 'noshow') return 'No Show';
    if (attendance === 'cancelled') return 'Cancelled';
    if (attendance === 'latebail') return 'Late Bail';
    if (attendance === 'no-register-show') return 'Attended Without Signup';
    
    if (orderStatus === 'processing' && (!attendance || attendance === 'pending')) return 'Signed Up';
    if (orderStatus === 'on-hold' || orderStatus === 'pending') return 'Other';
    
    return 'Other';
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Attended': return 'green';
      case 'No Show': return 'red';
      case 'Cancelled': return 'gray';
      case 'Late Bail': return 'orange';
      case 'Signed Up': return 'blue';
      case 'Attended Without Signup': return 'teal';
      default: return 'yellow';
    }
  };

  // Helper function to check if it's a first timer
  const isFirstTimer = (participant: TripParticipant) => {
    const attendedScore = participant.meta?.['stats_attendance_attended_cached'];
    return !attendedScore || attendedScore === '0' || attendedScore === '';
  };

  // Helper to format gear list
  const formatGearList = (gearString?: string) => {
    if (!gearString) return <Text>None specified</Text>;
    
    const gearItems = gearString.split(',').map(item => item.trim()).filter(Boolean);
    
    if (gearItems.length === 0) return <Text>None specified</Text>;
    
    return (
      <List size="sm">
        {gearItems.map((item, index) => (
          <List.Item key={index}>{item}</List.Item>
        ))}
      </List>
    );
  };

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
        <Text>Just to state the obvious, people who aren't you, can't see all this info</Text>
      </Group>

      {participants.length === 0 ? (
        <Alert icon={<IconInfoCircle size={16} />} color="blue">
          No participants have signed up for this trip yet.
        </Alert>
      ) : (
        <>
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="cavers" leftSection={<IconUsers size={14} />}>
                Cavers
              </Tabs.Tab>
              <Tabs.Tab value="skills" leftSection={<IconSchool size={14} />}>
                Skills
              </Tabs.Tab>
              <Tabs.Tab value="equipment" leftSection={<IconTools size={14} />}>
                Equipment
              </Tabs.Tab>
              <Tabs.Tab value="dietary">Dietary Requirements</Tabs.Tab>
              <Tabs.Tab value="transport">Transport</Tabs.Tab>
              <Tabs.Tab value="health" leftSection={<IconMedicalCross size={14} />}>
                Health Info
              </Tabs.Tab>
              <Tabs.Tab value="roles" leftSection={<IconHeartHandshake size={14} />}>
                Roles & Volunteering
              </Tabs.Tab>
              <Tabs.Tab value="stats" leftSection={<IconChartBar size={14} />}>
                Stats
              </Tabs.Tab>
              <Tabs.Tab value="emergency" leftSection={<IconShield size={14} />}>
                Emergency Contacts
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="cavers" pt="xs">
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Signup Status</Table.Th>
                    <Table.Th>First Timer</Table.Th>
                    <Table.Th>Volunteer Role</Table.Th>
                    <Table.Th>Order ID</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {participants.map((participant) => {
                    const status = getSignupStatus(participant);
                    const firstTimer = isFirstTimer(participant);
                    
                    return (
                      <Table.Tr key={participant.order_id}>
                        <Table.Td>{participant.first_name} {participant.last_name}</Table.Td>
                        <Table.Td>
                          <Badge color={getStatusColor(status)}>
                            {status}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          {firstTimer ? (
                            <Badge color="red" variant="light">First Timer</Badge>
                          ) : 'No'}
                        </Table.Td>
                        <Table.Td>
                          {participant.order_meta?.cc_volunteer &&
                          participant.order_meta.cc_volunteer !== 'none' ? (
                            <Badge color="green">
                              {participant.order_meta.cc_volunteer}
                            </Badge>
                          ) : 'None'}
                        </Table.Td>
                        <Table.Td>
                          <Anchor 
                            href={`https://www.cavingcrew.com/wp-admin/post.php?post=${participant.order_id}&action=edit`}
                            target="_blank"
                          >
                            {participant.order_id}
                          </Anchor>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
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
                    <Table.Th>Leading Horizontal</Table.Th>
                    <Table.Th>Leading SRT</Table.Th>
                    <Table.Th>Leading Coaching</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {participants.map((participant) => (
                    <Table.Tr key={participant.order_id}>
                      <Table.Td>{participant.first_name} {participant.last_name}</Table.Td>
                      <Table.Td>{participant.meta?.['skills-horizontal'] || 'Not specified'}</Table.Td>
                      <Table.Td>{participant.meta?.['skills-srt'] || 'Not specified'}</Table.Td>
                      <Table.Td>
                        {participant.meta?.['skills-leading-horizontal'] || 
                         participant.meta?.['caving-horizontal-happy-to-second-or-lead'] || 
                         'Not specified'}
                      </Table.Td>
                      <Table.Td>
                        {participant.meta?.['skills-leading-srt'] || 
                         participant.meta?.['caving-srt-happy-to-second-or-lead'] || 
                         'Not specified'}
                      </Table.Td>
                      <Table.Td>{participant.meta?.['skills-leading-coaching'] || 'Not specified'}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Tabs.Panel>

            <Tabs.Panel value="equipment" pt="xs">
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Wellies Size</Table.Th>
                    <Table.Th>Gear Bringing</Table.Th>
                    <Table.Th>Walking Equipment</Table.Th>
                    <Table.Th>Rope Length</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {participants.map((participant) => (
                    <Table.Tr key={participant.order_id}>
                      <Table.Td>{participant.first_name} {participant.last_name}</Table.Td>
                      <Table.Td>{participant.meta?.['gear_wellies_size'] || 'Not specified'}</Table.Td>
                      <Table.Td>
                        {formatGearList(participant.meta?.['gear-bringing-evening-or-day-trip'])}
                      </Table.Td>
                      <Table.Td>{participant.meta?.['gear-walking-equipment-weekend'] || 'Not specified'}</Table.Td>
                      <Table.Td>{participant.meta?.['gear-rope-length'] || 'Not specified'}</Table.Td>
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

            <Tabs.Panel value="health" pt="xs">
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Health Details</Table.Th>
                    <Table.Th>Shoulder Issues</Table.Th>
                    <Table.Th>Asthma</Table.Th>
                    <Table.Th>Missing Medication</Table.Th>
                    <Table.Th>Medication Impairment</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {participants.map((participant) => (
                    <Table.Tr key={participant.order_id}>
                      <Table.Td>{participant.first_name} {participant.last_name}</Table.Td>
                      <Table.Td>{participant.admin_meta?.['admin-diet-allergies-health-extra-info'] || 'None'}</Table.Td>
                      <Table.Td>
                        {participant.admin_meta?.['admin-health-shoulder'] ? (
                          <ThemeIcon color="red" variant="light">
                            <IconAlertTriangle size={16} />
                          </ThemeIcon>
                        ) : (
                          <ThemeIcon color="green" variant="light">
                            <IconCheck size={16} />
                          </ThemeIcon>
                        )}
                      </Table.Td>
                      <Table.Td>
                        {participant.admin_meta?.['admin-health-asthma'] ? (
                          <ThemeIcon color="red" variant="light">
                            <IconAlertTriangle size={16} />
                          </ThemeIcon>
                        ) : (
                          <ThemeIcon color="green" variant="light">
                            <IconCheck size={16} />
                          </ThemeIcon>
                        )}
                      </Table.Td>
                      <Table.Td>
                        {participant.admin_meta?.['admin-health-missing-dose'] ? (
                          <ThemeIcon color="red" variant="light">
                            <IconAlertTriangle size={16} />
                          </ThemeIcon>
                        ) : (
                          <ThemeIcon color="green" variant="light">
                            <IconCheck size={16} />
                          </ThemeIcon>
                        )}
                      </Table.Td>
                      <Table.Td>
                        {participant.admin_meta?.['admin-health-impairment-through-medication'] ? (
                          <ThemeIcon color="red" variant="light">
                            <IconAlertTriangle size={16} />
                          </ThemeIcon>
                        ) : (
                          <ThemeIcon color="green" variant="light">
                            <IconCheck size={16} />
                          </ThemeIcon>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Tabs.Panel>

            <Tabs.Panel value="roles" pt="xs">
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Volunteer Role</Table.Th>
                    <Table.Th>Last Caving Date</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {participants.map((participant) => (
                    <Table.Tr key={participant.order_id}>
                      <Table.Td>{participant.first_name} {participant.last_name}</Table.Td>
                      <Table.Td>
                        {participant.order_meta?.cc_volunteer &&
                        participant.order_meta.cc_volunteer !== 'none' ? (
                          <Badge color="green">
                            {participant.order_meta.cc_volunteer}
                          </Badge>
                        ) : 'None'}
                      </Table.Td>
                      <Table.Td>{participant.meta?.['cc_compliance_last_date_of_caving'] || 'Unknown'}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Tabs.Panel>

            <Tabs.Panel value="stats" pt="xs">
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Attendance Score</Table.Th>
                    <Table.Th>Volunteer Score</Table.Th>
                    <Table.Th>Volunteer Reliability</Table.Th>
                    <Table.Th>Attendance Reliability</Table.Th>
                    <Table.Th>Volunteer Stats</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {participants.map((participant) => (
                    <Table.Tr key={participant.order_id}>
                      <Table.Td>{participant.first_name} {participant.last_name}</Table.Td>
                      <Table.Td>{participant.meta?.['stats_attendance_attended_cached'] || '0'}</Table.Td>
                      <Table.Td>{participant.meta?.['scores_volunteer_score_cached'] || '0'}</Table.Td>
                      <Table.Td>{participant.meta?.['scores_volunteer_reliability_score_cached'] || '0'}</Table.Td>
                      <Table.Td>{participant.meta?.['scores_attendance_reliability_score_cached'] || '0'}</Table.Td>
                      <Table.Td>
                        {participant.meta?.['stats_volunteer_for_numerator_cached'] || '0'}/
                        {participant.meta?.['stats_volunteer_for_denominator_cached'] || '0'}
                        {participant.meta?.['stats_volunteer_for_but_no_attend_cached'] && 
                         participant.meta?.['stats_volunteer_for_but_no_attend_cached'] !== '0' ? 
                          ` (${participant.meta?.['stats_volunteer_for_but_no_attend_cached']} no-shows)` : ''}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Tabs.Panel>

            <Tabs.Panel value="emergency" pt="xs">
              <Alert icon={<IconInfoCircle size={16} />} color="blue" mb="md">
                This tab contains sensitive personal information. Only access it when necessary for emergency purposes.
              </Alert>
              
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Phone</Table.Th>
                    <Table.Th>Emergency Contact</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {participants.map((participant) => (
                    <Table.Tr key={participant.order_id}>
                      <Table.Td>{participant.first_name} {participant.last_name}</Table.Td>
                      <Table.Td>{participant.admin_meta?.['admin-phone-number'] || participant.admin_meta?.['billing_phone'] || 'Not provided'}</Table.Td>
                      <Table.Td>
                        {participant.admin_meta?.['admin-emergency-contact-name'] || 'Not provided'}
                        {participant.admin_meta?.['admin-emergency-contact-phone'] ?
                          ` (${participant.admin_meta['admin-emergency-contact-phone']})` : ''}
                      </Table.Td>
                      <Table.Td>
                        <Button 
                          size="xs" 
                          variant="outline" 
                          color="blue"
                          onClick={() => {
                            setSelectedParticipant(participant);
                            setEmergencyModalOpen(true);
                          }}
                        >
                          View Full Details
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Tabs.Panel>
          </Tabs>

          {/* Emergency Information Modal */}
          <Modal
            opened={emergencyModalOpen}
            onClose={() => setEmergencyModalOpen(false)}
            title={
              <Title order={4}>
                Emergency Information - {selectedParticipant?.first_name} {selectedParticipant?.last_name}
              </Title>
            }
            size="lg"
          >
            <Alert 
              icon={<IconAlertTriangle size={16} />} 
              color="red" 
              title="Confidential Information" 
              mb="md"
            >
              This is for emergency use by authorized people only - not just to be nosy. Access is logged.
            </Alert>
            
            {selectedParticipant && (
              <Stack>
                <Group>
                  <Text fw={700}>Full Name:</Text>
                  <Text>{selectedParticipant.first_name} {selectedParticipant.last_name}</Text>
                </Group>
                
                <Group>
                  <Text fw={700}>Phone Number:</Text>
                  <Text>{selectedParticipant.admin_meta?.['admin-phone-number'] || selectedParticipant.admin_meta?.['billing_phone'] || 'Not provided'}</Text>
                </Group>
                
                <Group align="flex-start">
                  <Text fw={700}>Emergency Contact:</Text>
                  <Box>
                    <Text>{selectedParticipant.admin_meta?.['admin-emergency-contact-name'] || 'Not provided'}</Text>
                    <Text>{selectedParticipant.admin_meta?.['admin-emergency-contact-phone'] || 'No phone provided'}</Text>
                    <Text>{selectedParticipant.admin_meta?.['admin-emergency-contact-relationship'] || 'Relationship not specified'}</Text>
                  </Box>
                </Group>
                
                <Group align="flex-start">
                  <Text fw={700}>Address:</Text>
                  <Box>
                    <Text>{selectedParticipant.admin_meta?.['billing_address_1'] || 'Not provided'}</Text>
                    {selectedParticipant.admin_meta?.['billing_address_2'] && (
                      <Text>{selectedParticipant.admin_meta?.['billing_address_2']}</Text>
                    )}
                    <Text>
                      {[
                        selectedParticipant.admin_meta?.['billing_city'],
                        selectedParticipant.admin_meta?.['billing_postcode']
                      ].filter(Boolean).join(', ')}
                    </Text>
                  </Box>
                </Group>
                
                <Group>
                  <Text fw={700}>Date of Birth:</Text>
                  <Text>{selectedParticipant.admin_meta?.['admin-date-of-birth'] || 'Not provided'}</Text>
                </Group>
                
                <Group>
                  <Text fw={700}>Car Registration:</Text>
                  <Text>{selectedParticipant.admin_meta?.['admin-car-registration'] || 'Not provided'}</Text>
                </Group>
                
                <Group align="flex-start">
                  <Text fw={700}>Health Information:</Text>
                  <Box>
                    <Text>{selectedParticipant.admin_meta?.['admin-diet-allergies-health-extra-info'] || 'None provided'}</Text>
                    {selectedParticipant.admin_meta?.['admin-health-shoulder'] && (
                      <Text c="red">Has shoulder issues</Text>
                    )}
                    {selectedParticipant.admin_meta?.['admin-health-asthma'] && (
                      <Text c="red">Has asthma</Text>
                    )}
                    {selectedParticipant.admin_meta?.['admin-health-missing-dose'] && (
                      <Text c="red">Has medication that would be problematic if missed</Text>
                    )}
                    {selectedParticipant.admin_meta?.['admin-health-impairment-through-medication'] && (
                      <Text c="red">Takes medication that may cause impairment</Text>
                    )}
                  </Box>
                </Group>
                
                <Group justify="center" mt="md">
                  <Button onClick={() => setEmergencyModalOpen(false)}>Close</Button>
                </Group>
              </Stack>
            )}
          </Modal>
        </>
      )}
    </Paper>
  );
}
