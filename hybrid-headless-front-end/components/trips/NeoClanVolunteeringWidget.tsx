'use client';

import React, { useState } from 'react';
import {
    Paper, Title, Text, Group, Badge, Tabs, Table, Skeleton, Alert,
    Stack, Button, List, Anchor, Box, ThemeIcon, 
    CopyButton, ActionIcon, Tooltip
} from '@mantine/core';
import {
    IconUsers, IconAlertCircle, IconInfoCircle, IconTools,
    IconHeartHandshake, IconSchool, IconMedicalCross, IconShield,
    IconChartBar, IconCheck, IconX, IconAlertTriangle,
    IconFileDescription, IconMessage, IconCar
} from '@tabler/icons-react';

// Import custom hooks and types
import { useTripParticipants } from '../../lib/hooks/useTripParticipants';
import { useUser } from '../../lib/hooks/useUser';
import type { Trip, TripParticipant } from '../../types/api';

// Define props interface for the component
interface NeoClanVolunteeringWidgetProps {
    trip: Trip;
}

import { 
    determineSignupStatus, 
    getStatusColor, 
    isFirstTimeCaver, 
    formatGearList,
    cleanTackle
} from '../../utils/trip-participant-utils';
import {
    generateCalloutText,
    generateTackleRequestText,
    generateGearTripCheckText
} from '../../utils/trip-admin-utils';
import { formatRelativeTime } from '../../utils/date-utils';
import { 
    getSkillLabel, 
    getSkillDescription, 
    getSkillInfoUrl,
    getSkillDefinition
} from '../../utils/skill-definitions';
import {
    EmergencyAccessModal,
    EmergencyInfoModal,
    CalloutModal,
    TackleRequestModal,
    GearTripCheckModal,
    LiftCoordinationModal
} from './modals';

// Main component with improved structure and comments
export function NeoClanVolunteeringWidget({ trip }: NeoClanVolunteeringWidgetProps) {
    // State management for tabs and modal
    const [activeTab, setActiveTab] = useState<string | null>('cavers');
    const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
    const [selectedParticipant, setSelectedParticipant] = useState<TripParticipant | null>(null);
    const [confirmEmergencyAccess, setConfirmEmergencyAccess] = useState(false);
    const [calloutModalOpen, setCalloutModalOpen] = useState(false);
    const [calloutText, setCalloutText] = useState('');
    const [tackleRequestModalOpen, setTackleRequestModalOpen] = useState(false);
    const [tackleRequestText, setTackleRequestText] = useState('');
    const [gearTripCheckModalOpen, setGearTripCheckModalOpen] = useState(false);
    const [gearTripCheckText, setGearTripCheckText] = useState('');
    const [liftCoordinationModalOpen, setLiftCoordinationModalOpen] = useState(false);
    const [liftCoordinationText, setLiftCoordinationText] = useState('');

    // Fetch trip participants data
    const { data, isLoading, error } = useTripParticipants(trip.id);
    const { isLoggedIn } = useUser();

    // Extract participants and access level with default fallbacks
    const participants = data?.data?.participants || [];
    const accessLevel = data?.data?.access_level || 'public';

    // Loading state rendering
    if (isLoading) {
        return (
            <Paper withBorder p="md" radius="md">
                <Stack>
                    <Group justify="space-between">
                        <Title order={3}>People Who've Signed Up</Title>
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
                    Failed to load people's information. It probably isn't your fault. :) Please try again later.
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

    // Function to generate callout text
    const handleGenerateCalloutText = () => {
        const text = generateCalloutText(trip, participants);
        setCalloutText(text);
        setCalloutModalOpen(true);
    };

    // Function to generate tackle request text
    const handleGenerateTackleRequestText = () => {
        const text = generateTackleRequestText(trip, participants);
        setTackleRequestText(text);
        setTackleRequestModalOpen(true);
    };

    // Function to generate gear trip check text
    const handleGenerateGearTripCheckText = () => {
        const text = generateGearTripCheckText(trip, participants);
        setGearTripCheckText(text);
        setGearTripCheckModalOpen(true);
    };

    // Function to open lift coordination modal
    const handleOpenLiftCoordinationModal = () => {
        setLiftCoordinationText(''); // Reset text to trigger auto-generation
        setLiftCoordinationModalOpen(true);
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
                <Alert
                    color="blue"
                    variant="light"
                    title="Private Information"
                    styles={{
                        root: {
                            marginTop: '0.5rem',
                        },
                        wrapper: {
                            flexWrap: 'wrap',
                        },
                        title: {
                            fontWeight: 600,
                        }
                    }}
                >
                    This administrative information is only visible to you and other trip organizers
                </Alert>
            </Group>

            {participants.length === 0 ? (
                <Alert icon={<IconInfoCircle size={16} />} color="blue">
                    No one has signed up for this trip yet.
                </Alert>
            ) : (
                <>
                    <Tabs value={activeTab} onChange={setActiveTab}>
                        <Tabs.List>
                            <Tabs.Tab value="cavers" leftSection={<IconUsers size={14} />}>
                                People
                            </Tabs.Tab>
                            <Tabs.Tab value="skills" leftSection={<IconSchool size={14} />}>
                                Skills
                            </Tabs.Tab>
                            <Tabs.Tab value="equipment" leftSection={<IconTools size={14} />}>
                                Gear
                            </Tabs.Tab>
                            <Tabs.Tab value="dietary" leftSection={<IconInfoCircle size={14} />}>Dietary Requirements</Tabs.Tab>
                            <Tabs.Tab value="transport" leftSection={<IconCar size={14} />}>Lift Sharing</Tabs.Tab>
                            <Tabs.Tab value="health" leftSection={<IconMedicalCross size={14} />}>
                                Health & Dietary
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
                            <Group justify="flex-end" mb="md">
                                <Button
                                    leftSection={<IconMessage size={16} />}
                                    onClick={handleGenerateTackleRequestText}
                                    variant="outline"
                                    color="teal"
                                    mr="xs"
                                >
                                    Write a request to the tackle manager
                                </Button>
                                <Button
                                    leftSection={<IconFileDescription size={16} />}
                                    onClick={handleGenerateCalloutText}
                                    variant="outline"
                                    color="blue"
                                    mr="xs"
                                >
                                    Generate callout text
                                </Button>
                                <Button
                                    leftSection={<IconMessage size={16} />}
                                    onClick={handleGenerateGearTripCheckText}
                                    variant="outline"
                                    color="indigo"
                                >
                                    Gear Trip Check
                                </Button>
                            </Group>
                            <Table striped>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Name</Table.Th>
                                        <Table.Th>Status</Table.Th>
                                        <Table.Th>First Timer</Table.Th>
                                        <Table.Th>Role</Table.Th>
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
                                            <Table.Td>
                                                {participant.meta?.['skills-horizontal'] ? (
                                                    <Tooltip 
                                                        label={getSkillDescription('horizontalSkills', participant.meta['skills-horizontal'])}
                                                        disabled={!getSkillDescription('horizontalSkills', participant.meta['skills-horizontal'])}
                                                    >
                                                        <Badge 
                                                            color={getSkillDefinition('horizontalSkills', participant.meta['skills-horizontal'])?.color || 'blue'} 
                                                            variant="light"
                                                            component={getSkillInfoUrl('horizontalSkills', participant.meta['skills-horizontal']) ? 'a' : 'div'}
                                                            href={getSkillInfoUrl('horizontalSkills', participant.meta['skills-horizontal'])}
                                                            target="_blank"
                                                            style={{ cursor: getSkillInfoUrl('horizontalSkills', participant.meta['skills-horizontal']) ? 'pointer' : 'default' }}
                                                        >
                                                            {getSkillLabel('horizontalSkills', participant.meta['skills-horizontal'])}
                                                        </Badge>
                                                    </Tooltip>
                                                ) : (
                                                    <Text c="dimmed">Not specified</Text>
                                                )}
                                            </Table.Td>
                                            <Table.Td>
                                                {participant.meta?.['skills-srt'] ? (
                                                    <Tooltip 
                                                        label={getSkillDescription('srtSkills', participant.meta['skills-srt'])}
                                                        disabled={!getSkillDescription('srtSkills', participant.meta['skills-srt'])}
                                                    >
                                                        <Badge 
                                                            color={getSkillDefinition('srtSkills', participant.meta['skills-srt'])?.color || 'blue'} 
                                                            variant="light"
                                                            component={getSkillInfoUrl('srtSkills', participant.meta['skills-srt']) ? 'a' : 'div'}
                                                            href={getSkillInfoUrl('srtSkills', participant.meta['skills-srt'])}
                                                            target="_blank"
                                                            style={{ cursor: getSkillInfoUrl('srtSkills', participant.meta['skills-srt']) ? 'pointer' : 'default' }}
                                                        >
                                                            {getSkillLabel('srtSkills', participant.meta['skills-srt'])}
                                                        </Badge>
                                                    </Tooltip>
                                                ) : (
                                                    <Text c="dimmed">Not specified</Text>
                                                )}
                                            </Table.Td>
                                            <Table.Td>
                                                {participant.meta?.['skills-leading-horizontal'] || participant.meta?.['caving-horizontal-happy-to-second-or-lead'] ? (
                                                    <Tooltip 
                                                        label={getSkillDescription('leadingHorizontalSkills', 
                                                            participant.meta['skills-leading-horizontal'] || 
                                                            participant.meta['caving-horizontal-happy-to-second-or-lead']
                                                        )}
                                                        disabled={!getSkillDescription('leadingHorizontalSkills', 
                                                            participant.meta['skills-leading-horizontal'] || 
                                                            participant.meta['caving-horizontal-happy-to-second-or-lead']
                                                        )}
                                                    >
                                                        <Badge 
                                                            color={getSkillDefinition('leadingHorizontalSkills', 
                                                                participant.meta['skills-leading-horizontal'] || 
                                                                participant.meta['caving-horizontal-happy-to-second-or-lead']
                                                            )?.color || 'teal'} 
                                                            variant="light"
                                                            component={getSkillInfoUrl('leadingHorizontalSkills', 
                                                                participant.meta['skills-leading-horizontal'] || 
                                                                participant.meta['caving-horizontal-happy-to-second-or-lead']
                                                            ) ? 'a' : 'div'}
                                                            href={getSkillInfoUrl('leadingHorizontalSkills', 
                                                                participant.meta['skills-leading-horizontal'] || 
                                                                participant.meta['caving-horizontal-happy-to-second-or-lead']
                                                            )}
                                                            target="_blank"
                                                            style={{ cursor: getSkillInfoUrl('leadingHorizontalSkills', 
                                                                participant.meta['skills-leading-horizontal'] || 
                                                                participant.meta['caving-horizontal-happy-to-second-or-lead']
                                                            ) ? 'pointer' : 'default' }}
                                                        >
                                                            {getSkillLabel('leadingHorizontalSkills', 
                                                                participant.meta['skills-leading-horizontal'] || 
                                                                participant.meta['caving-horizontal-happy-to-second-or-lead']
                                                            )}
                                                        </Badge>
                                                    </Tooltip>
                                                ) : (
                                                    <Text c="dimmed">Not specified</Text>
                                                )}
                                            </Table.Td>
                                            <Table.Td>
                                                {participant.meta?.['skills-leading-srt'] || participant.meta?.['caving-srt-happy-to-second-or-lead'] ? (
                                                    <Tooltip 
                                                        label={getSkillDescription('leadingSrtSkills', 
                                                            participant.meta['skills-leading-srt'] || 
                                                            participant.meta['caving-srt-happy-to-second-or-lead']
                                                        )}
                                                        disabled={!getSkillDescription('leadingSrtSkills', 
                                                            participant.meta['skills-leading-srt'] || 
                                                            participant.meta['caving-srt-happy-to-second-or-lead']
                                                        )}
                                                    >
                                                        <Badge 
                                                            color={getSkillDefinition('leadingSrtSkills', 
                                                                participant.meta['skills-leading-srt'] || 
                                                                participant.meta['caving-srt-happy-to-second-or-lead']
                                                            )?.color || 'orange'} 
                                                            variant="light"
                                                            component={getSkillInfoUrl('leadingSrtSkills', 
                                                                participant.meta['skills-leading-srt'] || 
                                                                participant.meta['caving-srt-happy-to-second-or-lead']
                                                            ) ? 'a' : 'div'}
                                                            href={getSkillInfoUrl('leadingSrtSkills', 
                                                                participant.meta['skills-leading-srt'] || 
                                                                participant.meta['caving-srt-happy-to-second-or-lead']
                                                            )}
                                                            target="_blank"
                                                            style={{ cursor: getSkillInfoUrl('leadingSrtSkills', 
                                                                participant.meta['skills-leading-srt'] || 
                                                                participant.meta['caving-srt-happy-to-second-or-lead']
                                                            ) ? 'pointer' : 'default' }}
                                                        >
                                                            {getSkillLabel('leadingSrtSkills', 
                                                                participant.meta['skills-leading-srt'] || 
                                                                participant.meta['caving-srt-happy-to-second-or-lead']
                                                            )}
                                                        </Badge>
                                                    </Tooltip>
                                                ) : (
                                                    <Text c="dimmed">Not specified</Text>
                                                )}
                                            </Table.Td>
                                            <Table.Td>
                                                {participant.meta?.['skills-leading-coaching'] ? (
                                                    <Tooltip 
                                                        label={getSkillDescription('leadingCoachingSkills', participant.meta['skills-leading-coaching'])}
                                                        disabled={!getSkillDescription('leadingCoachingSkills', participant.meta['skills-leading-coaching'])}
                                                    >
                                                        <Badge 
                                                            color={getSkillDefinition('leadingCoachingSkills', participant.meta['skills-leading-coaching'])?.color || 'grape'} 
                                                            variant="light"
                                                            component={getSkillInfoUrl('leadingCoachingSkills', participant.meta['skills-leading-coaching']) ? 'a' : 'div'}
                                                            href={getSkillInfoUrl('leadingCoachingSkills', participant.meta['skills-leading-coaching'])}
                                                            target="_blank"
                                                            style={{ cursor: getSkillInfoUrl('leadingCoachingSkills', participant.meta['skills-leading-coaching']) ? 'pointer' : 'default' }}
                                                        >
                                                            {getSkillLabel('leadingCoachingSkills', participant.meta['skills-leading-coaching'])}
                                                        </Badge>
                                                    </Tooltip>
                                                ) : (
                                                    <Text c="dimmed">Not specified</Text>
                                                )}
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Tabs.Panel>

                        <Tabs.Panel value="equipment" pt="xs">
                            <Group justify="space-between" mb="md">
                                <Badge color="blue" variant="light">
                                    Required gear for this trip: {
                                        trip.route?.acf?.route_personal_gear_required
                                            ? (typeof trip.route.acf.route_personal_gear_required === 'string'
                                                ? trip.route.acf.route_personal_gear_required.replace(/<[^>]*>/g, '').trim().replace(/,/g, ', ')
                                                : String(trip.route.acf.route_personal_gear_required).replace(/,/g, ', '))
                                            : trip.acf.event_gear_required || 'None specified'
                                    }
                                </Badge>
                                <Button
                                    leftSection={<IconMessage size={16} />}
                                    onClick={handleGenerateTackleRequestText}
                                    variant="outline"
                                    color="teal"
                                    size="sm"
                                >
                                    Generate tackle request
                                </Button>
                            </Group>
                            <Table striped>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Name</Table.Th>
                                        <Table.Th>Gear Bringing</Table.Th>
                                        <Table.Th>Needs</Table.Th>
                                        <Table.Th>Additional Gear</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {participants.map((participant) => {
                                        // Parse gear bringing from participant meta
                                        const gearBringing = participant.meta?.['gear-bringing-evening-or-day-trip'] || '';
                                        const welliesSize = participant.meta?.gear_wellies_size || '';

                                        // Parse individual items they're bringing
                                        const bringingItems = gearBringing.split(',').map(item => item.trim()).filter(Boolean);

                                        // Check if they're a new caver
                                        const isNewCaver = bringingItems.some(item =>
                                            item.includes('Nothing') || item.includes('totally new')
                                        );

                                        // Determine required gear based on trip type
                                        const requiresSRT = trip.acf.event_gear_required?.indexOf('SRT') !== -1 ||
                                                          trip.acf.event_skills_required?.indexOf('SRT') !== -1 ||
                                                          trip.route?.acf?.route_personal_gear_required?.indexOf('SRT') !== -1;

                                        // Get route personal gear requirements
                                        const routePersonalGear = trip.route?.acf?.route_personal_gear_required || '';

                                        // Get required gear from route if available, otherwise use standard list
                                        let standardGear: string[] = [];

                                        if (routePersonalGear) {
                                            // Parse from route_personal_gear_required
                                            standardGear = (typeof routePersonalGear === 'string'
                                                ? routePersonalGear.replace(/<[^>]*>/g, '')
                                                : String(routePersonalGear))
                                                .split(/[,;]/)
                                                .map(item => item.trim())
                                                .filter(Boolean);
                                        } else {
                                            // Default standard gear
                                            standardGear = [
                                                'Oversuit',
                                                'Undersuit',
                                                'Helmet and Light',
                                                'Kneepads',
                                                'Gloves',
                                                'Wellies'
                                            ];

                                            // Add SRT Kit if required for this trip
                                            if (requiresSRT) {
                                                standardGear.push('SRT Kit');
                                                if (!gearBringing.includes('SRT Kit') && !gearBringing.includes('Harness and Cowstails')) {
                                                    standardGear.push('Harness and Cowstails');
                                                }
                                            }
                                        }

                                        // Check what gear the participant is missing
                                        const missingGear: string[] = [];

                                        // Check each standard gear item
                                        standardGear.forEach(item => {
                                            // Skip checking if they're a new caver claiming to bring nothing
                                            if (isNewCaver && item !== 'Wellies') {
                                                missingGear.push(item);
                                                return;
                                            }

                                            // Special case for SRT Kit and Harness/Cowstails
                                            if (item === 'Harness and Cowstails' || item === 'SRT Kit') {
                                                // If they have SRT Kit, they have Harness and Cowstails covered
                                                const hasSRTKit = bringingItems.some(g =>
                                                    g.toLowerCase().includes('srt kit'));

                                                // If they have Harness and Cowstails specifically
                                                const hasHarnessAndCowstails = bringingItems.some(g =>
                                                    g.toLowerCase().includes('harness') &&
                                                    g.toLowerCase().includes('cowstail'));

                                                // If they have either SRT Kit or Harness and Cowstails, they're covered
                                                if ((item === 'SRT Kit' && hasSRTKit) ||
                                                    (item === 'Harness and Cowstails' && (hasSRTKit || hasHarnessAndCowstails))) {
                                                    return; // They have this covered
                                                }
                                            } else if (item === 'Helmet and Light') {
                                                // Special case for Helmet and Light
                                                // Check for combined "Helmet and Light" item
                                                const hasHelmetAndLight = bringingItems.some(g =>
                                                    g.toLowerCase().includes('helmet and light'));

                                                if (hasHelmetAndLight) {
                                                    return; // They have a combined helmet and light
                                                }

                                                // Check for separate helmet and light items (not spare light)
                                                const hasHelmet = bringingItems.some(g =>
                                                    g.toLowerCase().includes('helmet'));
                                                const hasLight = bringingItems.some(g =>
                                                    g.toLowerCase().includes('light') &&
                                                    !g.toLowerCase().includes('spare'));

                                                if (hasHelmet && hasLight) {
                                                    return; // They have both helmet and light
                                                }
                                            } else {
                                                // For all other items, check if they're bringing it
                                                const hasBrought = bringingItems.some(g =>
                                                    g.toLowerCase().includes(item.toLowerCase())
                                                );

                                                if (hasBrought) {
                                                    return; // They have this item
                                                }
                                            }

                                            // If we get here, they need this item
                                            if (item === 'Wellies') {
                                                if (welliesSize && welliesSize.trim() !== '') {
                                                    missingGear.push(`Wellies size ${welliesSize}`);
                                                } else {
                                                    missingGear.push('Wellies (size unknown)');
                                                }
                                            } else {
                                                missingGear.push(item);
                                            }
                                        });

                                        // Check for additional gear beyond requirements
                                        const additionalGear = bringingItems.filter(item => {
                                            // Skip if it's the "Nothing" option
                                            if (item.includes('Nothing') || item.includes('totally new')) {
                                                return false;
                                            }

                                            // Skip items that are part of the standard gear list
                                            for (const req of standardGear) {
                                                // Handle special cases first
                                                if (req === 'Helmet and Light') {
                                                    // Only match exact "Helmet and Light" or separate helmet/light items
                                                    // Don't match "Spare Light" as part of required gear
                                                    if (item.toLowerCase() === 'helmet and light' ||
                                                        item.toLowerCase() === 'helmet' ||
                                                        (item.toLowerCase().includes('light') &&
                                                         !item.toLowerCase().includes('spare'))) {
                                                        return false;
                                                    }
                                                    // Continue checking other requirements
                                                    continue;
                                                }

                                                // Standard comparison
                                                if (item.toLowerCase().includes(req.toLowerCase())) {
                                                    return false;
                                                }
                                            }

                                            // If we get here, this is additional gear
                                            return true;
                                        });

                                        // Check if rope is needed for this trip
                                        const tripRequiresRope = trip.route?.acf?.route_group_tackle_required?.toLowerCase().includes('rope') ||
                                                               trip.acf.event_gear_required?.toLowerCase().includes('srt');

                                        return (
                                            <Table.Tr key={participant.order_id}>
                                                <Table.Td>{participant.first_name} {participant.last_name}</Table.Td>
                                                <Table.Td>
                                                    {bringingItems.length === 0 ? (
                                                        <Text>None specified</Text>
                                                    ) : (
                                                        <Stack gap="xs">
                                                            {bringingItems
                                                                .filter(item => {
                                                                    // Only show items that match required gear
                                                                    if (item.includes('Nothing') || item.includes('totally new')) {
                                                                        return true; // Always show "Nothing" options
                                                                    }

                                                                    // Check if this item is in the required list
                                                                    return standardGear.some(req => {
                                                                        // Handle special cases first
                                                                        if (req === 'Helmet and Light') {
                                                                            // Only match exact "Helmet and Light" or separate helmet/light items
                                                                            // Don't match "Spare Light" as part of required gear
                                                                            if (item.toLowerCase() === 'helmet and light' ||
                                                                                item.toLowerCase() === 'helmet' ||
                                                                                (item.toLowerCase().includes('light') &&
                                                                                 !item.toLowerCase().includes('spare'))) {
                                                                                return true;
                                                                            }
                                                                            return false;
                                                                        }

                                                                        // Special case for SRT Kit and Harness/Cowstails
                                                                        if ((req === 'SRT Kit' || req === 'Harness and Cowstails') &&
                                                                            (item.toLowerCase().includes('srt kit') ||
                                                                             (item.toLowerCase().includes('harness') &&
                                                                              item.toLowerCase().includes('cowstail')))) {
                                                                            return true;
                                                                        }

                                                                        // Standard comparison
                                                                        return item.toLowerCase().includes(req.toLowerCase());
                                                                    });
                                                                })
                                                                .map((item, index) => (
                                                                    <Badge
                                                                        key={index}
                                                                        color={item.includes('Nothing') ? 'red' : 'blue'}
                                                                        variant="light"
                                                                    >
                                                                        {item}
                                                                    </Badge>
                                                                ))}
                                                        </Stack>
                                                    )}
                                                </Table.Td>
                                                <Table.Td>
                                                    {missingGear.length === 0 ? (
                                                        <Badge color="green">All required gear</Badge>
                                                    ) : (
                                                        <Stack gap="xs">
                                                            {missingGear.map((item, index) => (
                                                                <Badge
                                                                    key={index}
                                                                    color="red"
                                                                    variant="light"
                                                                >
                                                                    {item}
                                                                </Badge>
                                                            ))}
                                                            {!welliesSize && missingGear.some(g => g.includes('Wellies')) && (
                                                                <Badge color="orange" variant="light">
                                                                    Need wellie size
                                                                </Badge>
                                                            )}
                                                        </Stack>
                                                    )}
                                                </Table.Td>
                                                <Table.Td>
                                                    {additionalGear.length === 0 ? (
                                                        <Text c="dimmed">None</Text>
                                                    ) : (
                                                        <Stack gap="xs">
                                                            {additionalGear.map((item, index) => (
                                                                <Badge
                                                                    key={index}
                                                                    color="teal"
                                                                    variant="light"
                                                                >
                                                                    {item}
                                                                </Badge>
                                                            ))}
                                                            {/* Only show rope in additional gear if it's not part of required gear */}
                                                            {bringingItems.some(item => item.toLowerCase().includes('rope')) &&
                                                             !standardGear.some(item => item.toLowerCase().includes('rope')) ? (
                                                                <Badge color="teal" variant="light">
                                                                    {participant.meta?.['gear-rope-length']
                                                                        ? `Rope: ${participant.meta['gear-rope-length']}`
                                                                        : 'Ropes (length not specified)'}
                                                                </Badge>
                                                            ) : null}
                                                        </Stack>
                                                    )}
                                                </Table.Td>
                                            </Table.Tr>
                                        );
                                    })}
                                </Table.Tbody>
                            </Table>

                            <Box mt="lg">
                                <Alert icon={<IconInfoCircle size={16} />} color="blue" title="Equipment Legend">
                                    <Group gap="md">
                                        <Badge color="red" variant="light">Missing required gear</Badge>
                                        <Badge color="green">All required gear</Badge>
                                        <Badge color="teal" variant="light">Additional gear</Badge>
                                        <Badge color="orange" variant="light">Information needed</Badge>
                                    </Group>
                                </Alert>

                                {trip.acf.event_gear_required?.includes('SRT') && (
                                    <Alert icon={<IconInfoCircle size={16} />} color="yellow" mt="md">
                                        This trip requires SRT equipment. Ensure all people have proper vertical caving gear.
                                    </Alert>
                                )}

                                {participants.some(p =>
                                    p.meta?.['gear-bringing-evening-or-day-trip']?.includes('Nothing') ||
                                    p.meta?.['gear-bringing-evening-or-day-trip']?.includes('totally new')
                                ) && (
                                    <Alert icon={<IconInfoCircle size={16} />} color="red" mt="md">
                                        Some people are new and need full equipment. Please coordinate gear loans.
                                    </Alert>
                                )}

                                {participants.some(p => {
                                    // Check if this participant needs wellies but hasn't specified size
                                    const gearBringing = p.meta?.['gear-bringing-evening-or-day-trip'] || '';
                                    const hasWelliesSize = !!p.meta?.gear_wellies_size;
                                    const needsWellies = !gearBringing.includes('Wellies');
                                    return needsWellies && !hasWelliesSize;
                                }) && (
                                    <Alert icon={<IconInfoCircle size={16} />} color="orange" mt="md">
                                        Some people need wellies but haven't specified their size. Please check with them.
                                    </Alert>
                                )}
                            </Box>
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
                            <Group justify="flex-end" mb="md">
                                <Button
                                    leftSection={<IconCar size={16} />}
                                    onClick={handleOpenLiftCoordinationModal}
                                    variant="outline"
                                    color="blue"
                                >
                                    Generate Lift Coordination Message
                                </Button>
                            </Group>
                            <Table striped>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Name</Table.Th>
                                        <Table.Th>Needs Lift</Table.Th>
                                        <Table.Th>Can Give Lift</Table.Th>
                                        <Table.Th>Departure Time</Table.Th>
                                        <Table.Th>Leaving From</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {participants.map((participant) => (
                                        <Table.Tr key={participant.order_id}>
                                            <Table.Td>{participant.first_name} {participant.last_name}</Table.Td>
                                            <Table.Td>
                                                {participant.meta?.['transport-need-lift']?.toLowerCase() === 'yes' ? (
                                                    <Badge color="red">Needs Lift</Badge>
                                                ) : <Text c="dimmed">No</Text>}
                                            </Table.Td>
                                            <Table.Td>
                                                {participant.meta?.['transport-will-you-give-lift']?.toLowerCase() === 'yes' ? (
                                                 <Text>Yes</Text>
                                                ) : <Text c="dimmed">No</Text>}
                                            </Table.Td>
                                            <Table.Td>
                                                {participant.meta?.['transport-depature-time'] || 
                                                 <Text c="dimmed">Not specified</Text>}
                                            </Table.Td>
                                            <Table.Td>
                                                {participant.meta?.['transport-leaving-location'] || 
                                                 <Text c="dimmed">Not specified</Text>}
                                            </Table.Td>
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
                                        <Table.Th>Dietary Requirements</Table.Th>
                                        <Table.Th>Health Information</Table.Th>
                                        <Table.Th>Health Flags</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {participants.map((participant) => (
                                        <Table.Tr key={participant.order_id}>
                                            <Table.Td>{participant.first_name} {participant.last_name}</Table.Td>
                                            <Table.Td>{participant.meta?.['admin-dietary-requirements'] || 'None specified'}</Table.Td>
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
                                                    {Object.entries(participant.admin_meta || {})
                                                        .filter(([key, value]) => 
                                                            key.startsWith('admin-health-') && 
                                                            !['admin-health-shoulder', 'admin-health-asthma', 
                                                              'admin-health-missing-dose', 'admin-health-impairment-through-medication']
                                                                .includes(key) && 
                                                            value === 'yes')
                                                        .map(([key]) => (
                                                            <Badge key={key} color="orange" variant="light">
                                                                {key.replace('admin-health-', '').split('-').map(word => 
                                                                    word.charAt(0).toUpperCase() + word.slice(1)
                                                                ).join(' ')}
                                                            </Badge>
                                                        ))
                                                    }
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
                                            <Table.Td>{formatRelativeTime(participant.meta?.['cc_compliance_last_date_of_caving'])}</Table.Td>
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

                    {/* Modals */}
                    <EmergencyAccessModal
                        opened={confirmEmergencyAccess}
                        onClose={() => setConfirmEmergencyAccess(false)}
                        onConfirm={confirmAndShowEmergencyInfo}
                    />

                    <EmergencyInfoModal
                        opened={emergencyModalOpen}
                        onClose={() => setEmergencyModalOpen(false)}
                        participant={selectedParticipant}
                    />

                    <CalloutModal
                        opened={calloutModalOpen}
                        onClose={() => setCalloutModalOpen(false)}
                        calloutText={calloutText}
                        onTextChange={setCalloutText}
                        trip={trip}
                    />

                    <TackleRequestModal
                        opened={tackleRequestModalOpen}
                        onClose={() => setTackleRequestModalOpen(false)}
                        tackleRequestText={tackleRequestText}
                        onTextChange={setTackleRequestText}
                        trip={trip}
                    />

                    <GearTripCheckModal
                        opened={gearTripCheckModalOpen}
                        onClose={() => setGearTripCheckModalOpen(false)}
                        gearCheckText={gearTripCheckText}
                        onTextChange={setGearTripCheckText}
                        trip={trip}
                    />

                    <LiftCoordinationModal
                        opened={liftCoordinationModalOpen}
                        onClose={() => setLiftCoordinationModalOpen(false)}
                        liftCoordinationText={liftCoordinationText}
                        onTextChange={setLiftCoordinationText}
                        trip={trip}
                        participants={participants}
                    />
                </>
            )}
        </Paper>
    );

    return renderAccessLevelView();
}


