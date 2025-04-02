"use client";

import {
	ActionIcon,
	Alert,
	Badge,
	Button,
	Group,
	Modal,
	Paper,
	Select,
	Stack,
	Table,
	Text,
	Title,
	Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
	IconAlertCircle,
	IconCheck,
	IconEdit,
	IconHeartHandshake,
	IconInfoCircle,
	IconX,
} from "@tabler/icons-react";
import React, { useState } from "react";

// Import custom hooks and types
import { useTripParticipants } from "../../lib/hooks/useTripParticipants";
import { useUser } from "../../lib/hooks/useUser";
import type { Trip, TripParticipant } from "../../types/api";
import {
	determineSignupStatus,
	getStatusColor,
} from "../../utils/trip-participant-utils";
import { Auth } from "../../utils/user-utils";

// Define props interface for the component
interface NeoClanVolunteeringRolesProps {
	trip: Trip;
	onRoleAssigned?: () => void;
}

// Define volunteer role options
const VOLUNTEER_ROLES = [
	{ value: "none", label: "No Role" },
	{ value: "Trip Director", label: "Trip Director" },
	{ value: "Trip Leader", label: "Trip Leader" },
	{ value: "Trip Organiser", label: "Trip Organiser" },
	{ value: "tacklemanager", label: "Tackle Manager" },
	{ value: "lift", label: "Lift Coordinator" },
	{ value: "floorwalker", label: "Floor Walker" },
	{ value: "skillsharer", label: "Skill Sharer" },
	{ value: "announcements", label: "Announcements" },
	{ value: "checkin", label: "Check-in" },
	{ value: "pairing", label: "Pairing Coordinator" },
];

export function NeoClanVolunteeringRoles({
	trip,
	onRoleAssigned,
}: NeoClanVolunteeringRolesProps) {
	// State for role assignment modal
	const [opened, { open, close }] = useDisclosure(false);
	const [selectedParticipant, setSelectedParticipant] =
		useState<TripParticipant | null>(null);
	const [selectedRole, setSelectedRole] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Fetch trip participants data
	const { data, isLoading, error, refetch } = useTripParticipants(trip.id);
	const { user } = useUser();

	// Extract participants and access level with default fallbacks
	const participants = data?.data?.participants || [];
	const accessLevel = (data?.data?.access_level || "public") as
		| "public"
		| "logged_in"
		| "participant"
		| "event_role"
		| "admin"
		| "super_admin";

	// Check if user has permission to assign roles
	const canAssignRoles =
		Auth.isAdmin(user, accessLevel) ||
		Auth.isTripLeader(user, trip) ||
		Auth.isCommittee(user);

	// Function to open role assignment modal
	const handleOpenRoleModal = (participant: TripParticipant) => {
		setSelectedParticipant(participant);
		setSelectedRole(participant.order_meta?.cc_volunteer || "none");
		open();
	};

	// Function to assign role
	const handleAssignRole = async () => {
		if (!selectedParticipant || !selectedRole) return;

		setIsSubmitting(true);
		try {
			// This would be an API call to update the role
			// For now, we'll just simulate it with a timeout
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// In a real implementation, you would call an API endpoint like:
			// await fetch(`/api/orders/${selectedParticipant.order_id}/volunteer`, {
			//   method: 'PUT',
			//   headers: { 'Content-Type': 'application/json' },
			//   body: JSON.stringify({ role: selectedRole })
			// });

			// Show success notification
			notifications.show({
				title: "Role assigned",
				message: `Role updated for ${selectedParticipant.first_name} ${selectedParticipant.last_name}`,
				color: "green",
				icon: <IconCheck size={16} />,
			});

			// Refresh data
			refetch();
			if (onRoleAssigned) onRoleAssigned();

			// Close modal
			close();
		} catch (error) {
			// Show error notification
			notifications.show({
				title: "Error",
				message: "Failed to assign role. Please try again.",
				color: "red",
				icon: <IconX size={16} />,
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	// Loading state rendering
	if (isLoading) {
		return (
			<Paper withBorder p="md" radius="md">
				<Stack>
					<Title order={3}>Volunteer Roles</Title>
					<Text c="dimmed">Loading volunteer information...</Text>
				</Stack>
			</Paper>
		);
	}

	// Error handling
	if (error || !data?.success) {
		return (
			<Paper withBorder p="md" radius="md">
				<Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
					Failed to load volunteer information. Please try again later.
				</Alert>
			</Paper>
		);
	}

	// If no participants, show message
	if (participants.length === 0) {
		return (
			<Paper withBorder p="md" radius="md">
				<Title order={3} mb="md">
					Volunteer Roles
				</Title>
				<Text c="dimmed">No participants have signed up yet.</Text>
			</Paper>
		);
	}

	return (
		<Paper withBorder p="md" radius="md">
			<Group justify="space-between" mb="md">
				<Title order={3}>Volunteer Roles</Title>
				{canAssignRoles && (
					<Badge color="blue" size="lg">
						You can assign roles
					</Badge>
				)}
			</Group>

			{!canAssignRoles && (
				<Alert icon={<IconInfoCircle size={16} />} color="blue" mb="md">
					Volunteer roles are assigned by trip leaders and administrators.
				</Alert>
			)}

			<Table striped>
				<Table.Thead>
					<Table.Tr>
						<Table.Th>Name</Table.Th>
						<Table.Th>Role</Table.Th>
						<Table.Th>Status</Table.Th>
						{canAssignRoles && <Table.Th>Actions</Table.Th>}
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{participants.map((participant) => {
						const status = determineSignupStatus(participant);

						return (
							<Table.Tr key={participant.order_id}>
								<Table.Td>
									{participant.first_name} {participant.last_name}
								</Table.Td>
								<Table.Td>
									{participant.order_meta?.cc_volunteer &&
									participant.order_meta.cc_volunteer !== "none" ? (
										<Badge
											color="green"
											leftSection={<IconHeartHandshake size={14} />}
										>
											{participant.order_meta.cc_volunteer}
										</Badge>
									) : (
										<Text c="dimmed">No role assigned</Text>
									)}
								</Table.Td>
								<Table.Td>
									<Badge color={getStatusColor(status)}>{status}</Badge>
								</Table.Td>
								{canAssignRoles && (
									<Table.Td>
										<Tooltip label="Assign role">
											<ActionIcon
												variant="subtle"
												color="blue"
												onClick={() => handleOpenRoleModal(participant)}
											>
												<IconEdit size={16} />
											</ActionIcon>
										</Tooltip>
									</Table.Td>
								)}
							</Table.Tr>
						);
					})}
				</Table.Tbody>
			</Table>

			{/* Role assignment modal */}
			<Modal
				opened={opened}
				onClose={close}
				title="Assign Volunteer Role"
				centered
			>
				{selectedParticipant && (
					<Stack>
						<Text>
							Assigning role to {selectedParticipant.first_name}{" "}
							{selectedParticipant.last_name}
						</Text>

						<Select
							label="Select Role"
							placeholder="Choose a volunteer role"
							data={VOLUNTEER_ROLES}
							value={selectedRole}
							onChange={setSelectedRole}
							clearable={false}
						/>

						<Group justify="flex-end" mt="md">
							<Button variant="outline" onClick={close}>
								Cancel
							</Button>
							<Button
								onClick={handleAssignRole}
								loading={isSubmitting}
								leftSection={<IconHeartHandshake size={16} />}
							>
								Assign Role
							</Button>
						</Group>
					</Stack>
				)}
			</Modal>
		</Paper>
	);
}
