'use client';

import React, { useState } from 'react';
import {
    Paper, Title, Text, Group, Badge, Tabs, Table, Skeleton, Alert, 
    Stack, Button, Modal, List, Anchor, Box, ThemeIcon
} from '@mantine/core';
import { 
    IconUsers, IconAlertCircle, IconInfoCircle, IconTools, 
    IconHeartHandshake, IconSchool, IconMedicalCross, IconShield,
    IconChartBar, IconAlertTriangle, IconCheck, IconX
} from '@tabler/icons-react';

// Import custom hooks and types
import { useTripParticipants } from '@/lib/hooks/useTripParticipants';
import type { Trip, TripParticipant } from '@/types/api';

// Define props interface for the component
interface NeoClanVolunteeringWidgetProps {
    trip: Trip;
}

// Utility functions extracted for better readability and maintainability
const determineSignupStatus = (participant: TripParticipant): string => {
    const { cc_attendance: attendance } = participant.order_meta || {};
    const { order_status: orderStatus } = participant;

    // Comprehensive status mapping
    const statusMap: { [key: string]: string } = {
        'attended': 'Attended',
        'noshow': 'No Show',
        'cancelled': 'Cancelled',
        'latebail': 'Late Bail',
        'no-register-show': 'Attended Without Signup',
        'noregistershow': 'Attended Without Signup'
    };

    // Check predefined statuses first
    if (attendance && typeof attendance === 'string' && statusMap[attendance]) 
        return statusMap[attendance];

    // Handle pending and processing statuses
    if (orderStatus === 'processing' && (!attendance || attendance === 'pending')) 
        return 'Signed Up';
    
    if (orderStatus === 'on-hold' || orderStatus === 'pending') 
        return 'Other';

    return 'Other';
};

const getStatusColor = (status: string): string => {
    const colorMap: { [key: string]: string } = {
        'Attended': 'green',
        'No Show': 'red',
        'Cancelled': 'gray',
        'Late Bail': 'orange',
        'Signed Up': 'blue',
        'Attended Without Signup': 'teal',
        'Other': 'yellow'
    };

    return colorMap[status] || 'yellow';
};

const isFirstTimeCaver = (participant: TripParticipant): boolean => {
    const attendedScore = participant.meta?.['stats_attendance_attended_cached'];
    return !attendedScore || attendedScore === '0' || attendedScore === '';
};

const formatGearList = (gearString?: string | null) => {
    if (!gearString) return <Text>None specified</Text>;
    
    const gearItems = gearString.split(',')
        .map(item => item.trim())
        .filter(Boolean);
    
    return gearItems.length === 0 
        ? <Text>None specified</Text>
        : (
            <List size="sm">
                {gearItems.map((item, index) => (
                    <List.Item key={index}>{item}</List.Item>
                ))}
            </List>
        );
};

// Main component with improved structure and comments
export function NeoClanVolunteeringWidget({ trip }: NeoClanVolunteeringWidgetProps) {
    // State management for tabs and modal
    const [activeTab, setActiveTab] = useState<string | null>('cavers');
    const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
    const [selectedParticipant, setSelectedParticipant] = useState<TripParticipant | null>(null);
    const [confirmEmergencyAccess, setConfirmEmergencyAccess] = useState(false);

    // Fetch trip participants data
    const { data, isLoading, error } = useTripParticipants(trip.id);

    // Extract participants and access level with default fallbacks
    const participants = data?.data?.participants || [];
    const accessLevel = data?.data?.access_level || 'public';

    // Loading state rendering
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

    // Error handling
    if (error || !data?.success) {
        return (
            <Paper withBorder p="md" radius="md">
                <Alert 
                    icon={<IconAlertCircle size={16} />} 
                    title="Error" 
                    color="red"
                >
                    Failed to load participant information. Please try again later.
                </Alert>
            </Paper>
        );
    }

    // Function to open emergency info modal with confirmation
    const openEmergencyInfo = (participant: TripParticipant) => {
        setSelectedParticipant(participant);
        setConfirmEmergencyAccess(true);
    };

    // Function to confirm and show emergency info
    const confirmAndShowEmergencyInfo = () => {
        setConfirmEmergencyAccess(false);
        setEmergencyModalOpen(true);
    };

    // Render different views based on access level
    const renderAccessLevelView = () => {
        switch (accessLevel) {
            case 'public':
                return renderPublicView();
            case 'participant':
                return renderParticipantView();
            default:
                return renderAdminView();
        }
    };

    // Public view - minimal information
    const renderPublicView = () => (
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

    // Participant view - more details but still limited
    const renderParticipantView = () => (
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

    // Admin view - comprehensive information with tabs
    const renderAdminView = () => (
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
                                        const status = determineSignupStatus(participant);
                                        const firstTimer = isFirstTimeCaver(participant);
                                        
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
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {participants.map((participant) => (
                                        <Table.Tr key={participant.order_id}>
                                            <Table.Td>{participant.first_name} {participant.last_name}</Table.Td>
                                            <Table.Td>{participant.meta?.['admin-dietary-requirements'] || 'None specified'}</Table.Td>
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
                                        <Table.Th>Giving Lift</Table.Th>
                                        <Table.Th>Departure Time</Table.Th>
                                        <Table.Th>Leaving From</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {participants.map((participant) => (
                                        <Table.Tr key={participant.order_id}>
                                            <Table.Td>{participant.first_name} {participant.last_name}</Table.Td>
                                            <Table.Td>
                                                {participant.meta?.['transport-need-lift'] === 'yes' ? (
                                                    <Badge color="red">Needs Lift</Badge>
                                                ) : 'No'}
                                            </Table.Td>
                                            <Table.Td>
                                                {participant.meta?.['transport-will-you-give-lift'] === 'yes' ? (
                                                    <Badge color="green">Giving Lift</Badge>
                                                ) : 'No'}
                                            </Table.Td>
                                            <Table.Td>{participant.meta?.['transport-depature-time'] || 'Not specified'}</Table.Td>
                                            <Table.Td>{participant.meta?.['transport-leaving-location'] || 'Not specified'}</Table.Td>
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
                                        <Table.Th>Health Information</Table.Th>
                                        <Table.Th>Health Flags</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {participants.map((participant) => (
                                        <Table.Tr key={participant.order_id}>
                                            <Table.Td>{participant.first_name} {participant.last_name}</Table.Td>
                                            <Table.Td>{participant.admin_meta?.['admin-diet-allergies-health-extra-info'] || 'None provided'}</Table.Td>
                                            <Table.Td>
                                                <Stack gap="xs">
                                                    {participant.admin_meta?.['admin-health-shoulder'] === 'yes' && (
                                                        <Badge color="red" variant="light">Shoulder Issues</Badge>
                                                    )}
                                                    {participant.admin_meta?.['admin-health-asthma'] === 'yes' && (
                                                        <Badge color="red" variant="light">Asthma</Badge>
                                                    )}
                                                    {participant.admin_meta?.['admin-health-missing-dose'] === 'yes' && (
                                                        <Badge color="red" variant="light">Critical Medication</Badge>
                                                    )}
                                                    {participant.admin_meta?.['admin-health-impairment-through-medication'] === 'yes' && (
                                                        <Badge color="red" variant="light">Medication Impairment</Badge>
                                                    )}
                                                </Stack>
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
                                        <Table.Th>Trip Role</Table.Th>
                                        <Table.Th>Attendance Status</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {participants.map((participant) => (
                                        <Table.Tr key={participant.order_id}>
                                            <Table.Td>{participant.first_name} {participant.last_name}</Table.Td>
                                            <Table.Td>
                                                {participant.order_meta?.cc_volunteer && 
                                                participant.order_meta.cc_volunteer !== 'none' ? (
                                                    <Badge color="green">{participant.order_meta.cc_volunteer}</Badge>
                                                ) : 'None'}
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge color={getStatusColor(determineSignupStatus(participant))}>
                                                    {determineSignupStatus(participant)}
                                                </Badge>
                                            </Table.Td>
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
                                        <Table.Th>Trips Attended</Table.Th>
                                        <Table.Th>Last Caving Date</Table.Th>
                                        <Table.Th>Volunteer Score</Table.Th>
                                        <Table.Th>Reliability Score</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {participants.map((participant) => (
                                        <Table.Tr key={participant.order_id}>
                                            <Table.Td>{participant.first_name} {participant.last_name}</Table.Td>
                                            <Table.Td>{participant.meta?.['stats_attendance_attended_cached'] || '0'}</Table.Td>
                                            <Table.Td>{participant.meta?.['cc_compliance_last_date_of_caving'] || 'Unknown'}</Table.Td>
                                            <Table.Td>
                                                {participant.meta?.['scores_volunteer_score_cached'] ? (
                                                    <Badge 
                                                        color={
                                                            parseFloat(participant.meta['scores_volunteer_score_cached']) > 0.7 ? 'green' : 
                                                            parseFloat(participant.meta['scores_volunteer_score_cached']) > 0.4 ? 'yellow' : 'red'
                                                        }
                                                    >
                                                        {participant.meta['scores_volunteer_score_cached']}
                                                    </Badge>
                                                ) : 'N/A'}
                                            </Table.Td>
                                            <Table.Td>
                                                {participant.meta?.['scores_attendance_reliability_score_cached'] ? (
                                                    <Badge 
                                                        color={
                                                            parseFloat(participant.meta['scores_attendance_reliability_score_cached']) > 0.7 ? 'green' : 
                                                            parseFloat(participant.meta['scores_attendance_reliability_score_cached']) > 0.4 ? 'yellow' : 'red'
                                                        }
                                                    >
                                                        {participant.meta['scores_attendance_reliability_score_cached']}
                                                    </Badge>
                                                ) : 'N/A'}
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Tabs.Panel>

                        <Tabs.Panel value="emergency" pt="xs">
                            <Alert 
                                icon={<IconAlertTriangle size={16} />} 
                                color="red" 
                                title="Confidential Information" 
                                mb="md"
                            >
                                This information is for emergency use by authorized people only. Access is logged.
                            </Alert>
                            <Table striped>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Name</Table.Th>
                                        <Table.Th>Actions</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {participants.map((participant) => (
                                        <Table.Tr key={participant.order_id}>
                                            <Table.Td>{participant.first_name} {participant.last_name}</Table.Td>
                                            <Table.Td>
                                                <Button 
                                                    variant="outline" 
                                                    color="red" 
                                                    size="xs"
                                                    leftSection={<IconShield size={14} />}
                                                    onClick={() => openEmergencyInfo(participant)}
                                                >
                                                    View Emergency Info
                                                </Button>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Tabs.Panel>
                    </Tabs>

                    {/* Emergency Access Confirmation Modal */}
                    <Modal
                        opened={confirmEmergencyAccess}
                        onClose={() => setConfirmEmergencyAccess(false)}
                        title={
                            <Title order={4} c="red">
                                Emergency Information Access
                            </Title>
                        }
                        size="md"
                    >
                        <Alert 
                            icon={<IconAlertTriangle size={16} />} 
                            color="red" 
                            title="Confidential Information" 
                            mb="md"
                        >
                            This is for emergency use by authorized people only - not just to be nosy. Access is logged.
                        </Alert>
                        
                        <Text mb="md">
                            Are you sure you need to access this confidential emergency information?
                        </Text>
                        
                        <Group justify="center" mt="xl">
                            <Button 
                                variant="outline" 
                                onClick={() => setConfirmEmergencyAccess(false)}
                            >
                                Cancel
                            </Button>
                            <Button 
                                color="red" 
                                onClick={confirmAndShowEmergencyInfo}
                            >
                                Yes, I need this information
                            </Button>
                        </Group>
                    </Modal>

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
                                        {selectedParticipant.admin_meta?.['admin-health-shoulder'] === 'yes' && (
                                            <Text c="red">Has shoulder issues</Text>
                                        )}
                                        {selectedParticipant.admin_meta?.['admin-health-asthma'] === 'yes' && (
                                            <Text c="red">Has asthma</Text>
                                        )}
                                        {selectedParticipant.admin_meta?.['admin-health-missing-dose'] === 'yes' && (
                                            <Text c="red">Has medication that would be problematic if missed</Text>
                                        )}
                                        {selectedParticipant.admin_meta?.['admin-health-impairment-through-medication'] === 'yes' && (
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

    return renderAccessLevelView();
}


