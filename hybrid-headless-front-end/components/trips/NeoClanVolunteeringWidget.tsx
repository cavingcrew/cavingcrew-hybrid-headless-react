'use client';

import React, { useState } from 'react';
import {
    Paper, Title, Text, Group, Badge, Tabs, Table, Skeleton, Alert,
    Stack, Button, Modal, List, Anchor, Box, ThemeIcon, Textarea,
    CopyButton, ActionIcon, Tooltip
} from '@mantine/core';
import {
    IconUsers, IconAlertCircle, IconInfoCircle, IconTools,
    IconHeartHandshake, IconSchool, IconMedicalCross, IconShield,
    IconChartBar, IconAlertTriangle, IconCheck, IconX, IconCopy,
    IconFileDescription
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
    const [calloutModalOpen, setCalloutModalOpen] = useState(false);
    const [calloutText, setCalloutText] = useState('');

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

    // Function to generate callout text
    const generateCalloutText = () => {
        // Get current time
        const now = new Date();

        // Calculate callout time (now + route duration * 1.25)
        const routeDuration = trip.route?.acf?.route_time_for_eta ?
            parseInt(trip.route.acf.route_time_for_eta) : 4; // Default to 4 hours if not specified
        const calloutTimeMs = now.getTime() + (routeDuration * 1.25 * 60 * 60 * 1000);
        const calloutTime = new Date(calloutTimeMs);

        // Calculate ETA (callout time - 1 hour)
        const etaTimeMs = calloutTimeMs - (60 * 60 * 1000);
        const etaTime = new Date(etaTimeMs);

        // Format times
        const formatTime = (date: Date) => {
            return date.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        // Get cave and location information
        const getLocationName = () => {
            // For overnight trips, use the hut location
            if (trip.acf.event_type === 'overnight') {
                if (trip.hut?.hut_location?.post_title) {
                    return trip.hut.hut_location.post_title;
                }
                return trip.acf.event_location || trip.acf.event_cave_name || '';
            }

            // For other trips
            if (trip.route?.acf?.route_entrance_location_id?.title) {
                const locationTitle = trip.route.acf.route_entrance_location_id.title;
                const parkingLatLong = trip.route?.acf?.route_entrance_location_id?.acf?.location_parking_latlong;
                let city = '';

                // Check if parkingLatLong is an object with city property
                if (parkingLatLong && typeof parkingLatLong === 'object' && 'city' in parkingLatLong) {
                    city = parkingLatLong.city || '';
                }

                if (city) {
                    return `${locationTitle} near ${city}`;
                }
                return locationTitle;
            }

            if (trip.acf.event_cave_name) {
                if (trip.acf.event_possible_location) {
                    return `${trip.acf.event_cave_name} near ${trip.acf.event_possible_location}`;
                }
                return trip.acf.event_cave_name;
            }

            return trip.acf.event_location || trip.acf.event_possible_location || '';
        };

        // Get route name
        const routeName = trip.route?.acf?.route_name || trip.acf.event_possible_objectives || '';

        // Get parking location
        const getParkingLocation = () => {
            if (trip.route?.acf?.route_entrance_location_id?.acf?.location_parking_latlong) {
                const parking = trip.route.acf.route_entrance_location_id.acf.location_parking_latlong;
                if (typeof parking === 'object' && parking.lat && parking.lng) {
                    return `${parking.lat},${parking.lng}`;
                }
                return String(parking);
            }
            return '';
        };

        // Get signed up participants
        const signedUpParticipants = participants.filter(p => {
            const status = determineSignupStatus(p);
            return status === 'Signed Up';
        });

        const participantNames = signedUpParticipants.map(p => p.first_name).join(', ');
        const participantCount = signedUpParticipants.length;

        // Get car registrations
        const carRegistrations = signedUpParticipants
            .map(p => p.meta?.['admin-car-registration'] || p.admin_meta?.['admin-car-registration'])
            .filter(Boolean)
            .join(', ');

        // Get tackle requirements from route data
        const tackleRequired = trip.route?.acf?.route_group_tackle_required || '';

        // Clean up HTML tags if present
        const cleanTackle = tackleRequired.replace(/<[^>]*>/g, ', ')
            .replace(/,\s*,/g, ',')  // Remove double commas
            .replace(/^,\s*/, '')    // Remove leading comma
            .replace(/\s*,\s*$/, ''); // Remove trailing comma

        // Build the callout text with only defined sections
        let calloutTemplate = '';

        // Always include callout time and ETA
        calloutTemplate += `Callout: ${formatTime(calloutTime)}\n`;
        calloutTemplate += `ETA: ${formatTime(etaTime)}\n`;

        // Only include sections with data
        const locationName = getLocationName();
        if (locationName) {
            calloutTemplate += `Cave: ${locationName}\n`;
        }

        if (routeName) {
            calloutTemplate += `Route: ${routeName}\n`;
        }

        if (participantNames) {
            calloutTemplate += `${participantCount} People: ${participantNames}\n`;
        }

        const parkingLocation = getParkingLocation();
        if (parkingLocation) {
            // Trim lat/long to 5 decimal places (approx 1 meter accuracy)
            const trimmedLocation = parkingLocation.replace(/(-?\d+\.\d{5})\d*,(-?\d+\.\d{5})\d*/g, '$1,$2');
            calloutTemplate += `Parked at: ${trimmedLocation}\n`;

            if (carRegistrations) {
                calloutTemplate += `Car registrations: ${carRegistrations}\n`;
            }
        }

        calloutTemplate += `Equipped with:\n${cleanTackle}`;

        return calloutTemplate;
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
                            <Group justify="flex-end" mb="md">
                                <Button
                                    leftSection={<IconFileDescription size={16} />}
                                    onClick={() => {
                                        const text = generateCalloutText();
                                        setCalloutText(text);
                                        setCalloutModalOpen(true);
                                    }}
                                    variant="outline"
                                    color="blue"
                                >
                                    Write me a callout
                                </Button>
                            </Group>
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
                            <Group justify="flex-end" mb="md">
                                <Badge color="blue" variant="light">
                                    Required gear for this trip: {trip.acf.event_gear_required || 'None specified'}
                                </Badge>
                            </Group>
                            <Table striped>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Name</Table.Th>
                                        <Table.Th>Gear Bringing</Table.Th>
                                        <Table.Th>Missing Items</Table.Th>
                                        <Table.Th>Additional Gear</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {participants.map((participant) => {
                                        // Parse gear bringing from participant meta
                                        const gearBringing = participant.meta?.['gear-bringing-evening-or-day-trip'] || '';
                                        const gearItems = gearBringing.split(',')
                                            .map(item => item.trim())
                                            .filter(Boolean);

                                        // Determine required gear based on trip type
                                        const requiresSRT = trip.acf.event_gear_required?.includes('SRT') ||
                                                          trip.acf.event_skills_required?.includes('SRT') ||
                                                          trip.route?.acf?.route_personal_gear_required?.includes('SRT');

                                        // Standard gear requirements
                                        const requiredGear = [
                                            'Oversuit',
                                            'Undersuit',
                                            'Wellies',
                                            'Helmet and Light',
                                            'Gloves'
                                        ];

                                        // Add SRT kit if required
                                        if (requiresSRT) {
                                            requiredGear.push('SRT Kit', 'Harness and Cowstails');
                                        }

                                        // Check what's missing
                                        const missingGear = requiredGear.filter(item => {
                                            // Special case for "Nothing - Im totally new to this"
                                            if (gearItems.some(g => g.includes('Nothing') || g.includes('totally new'))) {
                                                return true;
                                            }

                                            // Check if the participant has this gear item
                                            return !gearItems.some(g =>
                                                g.toLowerCase().includes(item.toLowerCase()) ||
                                                // Handle special cases
                                                (item === 'Helmet and Light' &&
                                                 (g.toLowerCase().includes('helmet') || g.toLowerCase().includes('light')))
                                            );
                                        });

                                        // Check for additional gear beyond requirements
                                        const additionalGear = gearItems.filter(item => {
                                            // Skip if it's the "Nothing" option
                                            if (item.includes('Nothing') || item.includes('totally new')) {
                                                return false;
                                            }

                                            // Check if this item is not in the required list
                                            return !requiredGear.some(req =>
                                                item.toLowerCase().includes(req.toLowerCase()) ||
                                                // Handle special cases
                                                (req === 'Helmet and Light' &&
                                                 (item.toLowerCase().includes('helmet') || item.toLowerCase().includes('light')))
                                            );
                                        });

                                        // Check if wellies are needed but size not specified
                                        const needsWelliesSize = missingGear.includes('Wellies') &&
                                                               !participant.meta?.['gear_wellies_size'];

                                        return (
                                            <Table.Tr key={participant.order_id}>
                                                <Table.Td>{participant.first_name} {participant.last_name}</Table.Td>
                                                <Table.Td>
                                                    {gearItems.length === 0 ? (
                                                        <Text>None specified</Text>
                                                    ) : (
                                                        <Stack gap="xs">
                                                            {gearItems.map((item, index) => (
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
                                                                    Needs: {item}
                                                                    {item === 'Wellies' && participant.meta?.['gear_wellies_size'] &&
                                                                     ` (Size: ${participant.meta['gear_wellies_size']})`}
                                                                </Badge>
                                                            ))}
                                                            {needsWelliesSize && (
                                                                <Badge color="orange" variant="light">
                                                                    Wellies size not specified
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
                                                            {participant.meta?.['gear-rope-length'] && (
                                                                <Badge color="teal" variant="light">
                                                                    Rope: {participant.meta['gear-rope-length']}
                                                                </Badge>
                                                            )}
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
                                        This trip requires SRT equipment. Ensure all participants have proper vertical caving gear.
                                    </Alert>
                                )}

                                {participants.some(p =>
                                    p.meta?.['gear-bringing-evening-or-day-trip']?.includes('Nothing') ||
                                    p.meta?.['gear-bringing-evening-or-day-trip']?.includes('totally new')
                                ) && (
                                    <Alert icon={<IconInfoCircle size={16} />} color="red" mt="md">
                                        Some participants are new and need full equipment. Please coordinate gear loans.
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
                                                ) : 'No'}
                                            </Table.Td>
                                            <Table.Td>
                                                {participant.meta?.['transport-will-you-give-lift']?.toLowerCase() === 'yes' ? (
                                                 <Text>Yes</Text>
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

                    {/* Callout Modal */}
                    <Modal
                        opened={calloutModalOpen}
                        onClose={() => setCalloutModalOpen(false)}
                        title={
                            <Title order={4}>
                                Callout Information
                            </Title>
                        }
                        size="lg"
                    >
                        <Alert
                            icon={<IconInfoCircle size={16} />}
                            color="blue"
                            title="Advisory"
                            mb="md"
                        >
                            Please review and edit this information before sharing. Ensure all details are accurate and up-to-date.
                        </Alert>

                        <Textarea
                            value={calloutText}
                            onChange={(e) => setCalloutText(e.currentTarget.value)}
                            minRows={10}
                            autosize
                            mb="md"
                        />

                        <Group justify="space-between" mt="md">
                            <Button onClick={() => setCalloutModalOpen(false)}>
                                Close
                            </Button>
                            <CopyButton value={calloutText} timeout={2000}>
                                {({ copied, copy }) => (
                                    <Button
                                        color={copied ? 'teal' : 'blue'}
                                        onClick={copy}
                                        leftSection={<IconCopy size={16} />}
                                    >
                                        {copied ? 'Copied to clipboard' : 'Copy to clipboard'}
                                    </Button>
                                )}
                            </CopyButton>
                        </Group>
                    </Modal>
                </>
            )}
        </Paper>
    );

    return renderAccessLevelView();
}


