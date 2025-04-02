"use client";

import {
	Alert,
	Badge,
	Group,
	Paper,
	Select,
	Stack,
	Table,
	Text,
	Title,
	Tooltip,
} from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
	IconAlertCircle,
	IconCheck,
	IconHeartHandshake,
	IconInfoCircle,
	IconX,
} from "@tabler/icons-react";

// Import custom hooks and types
import { apiService } from "@/lib/api-service";
import { useTripParticipants } from "@/lib/hooks/useTripParticipants";
import { useUser } from "@/lib/hooks/useUser";
import type {
	Trip,
	TripParticipant,
	TripParticipantsResponse,
} from "@/types/api";
import {
	determineSignupStatus,
	getStatusColor,
} from "@/utils/trip-participant-utils";
import { Auth } from "@/utils/user-utils";

// Define props interface for the component
interface NeoClanVolunteeringRolesProps {
	trip: Trip;
	onRoleAssigned?: () => void;
}

// Define volunteer role options
const VOLUNTEER_ROLES = [
	{ value: "none", label: "No Role" },
	{ value: "trip_director", label: "Trip Director" },
	{ value: "event_assistant", label: "Event Assistant" },
	{ value: "lift_coordinator", label: "Lift Coordinator" },
	{ value: "climbing_coordinator", label: "Climbing Coordinator" },
	{ value: "kit_coordinator", label: "Kit Coordinator" },
	{ value: "buddy_coordinator", label: "Buddy Coordinator" },
	{ value: "postpromo1", label: "Post Promotion" },
	{ value: "breakfast_marshal", label: "Breakfast Marshal" },
	{ value: "lunch_marshal", label: "Lunch Marshal" },
	{ value: "covid_marshal", label: "COVID Marshal" },
	{
		value: "evening_meal_washingup_marshal",
		label: "Evening Meal/Washing Up Marshal",
	},
	{ value: "head_chef", label: "Head Chef" },
	{ value: "evening_meal_chef", label: "Evening Meal Chef" },
	{ value: "lunch_breakfast_chef", label: "Lunch/Breakfast Chef" },
];

export function NeoClanVolunteeringRoles({
	trip,
	onRoleAssigned,
}: NeoClanVolunteeringRolesProps) {
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
	const eventClosed = !!(data?.data as TripParticipantsResponse | undefined)
		?.event_closed;

	// Check if user has permission to assign roles
	const canAssignRoles =
		(Auth.isAdmin(user, accessLevel) ||
			Auth.isTripLeader(user, trip) ||
			Auth.isCommittee(user)) &&
		!eventClosed;

	// State for role change confirmation
	const [isRoleChangeModalOpen, setIsRoleChangeModalOpen] = useState(false);
	const [selectedParticipant, setSelectedParticipant] = useState<TripParticipant | null>(null);
	const [selectedNewRole, setSelectedNewRole] = useState("");
	const [selectedOldRole, setSelectedOldRole] = useState(""); 
	const [localRoles, setLocalRoles] = useState<Record<number, string>>({});

	// Debounced function to update role
	const debouncedRoleUpdate = useDebouncedCallback(
		async (participant: TripParticipant, newRole: string) => {
			try {
				const response = await apiService.updateVolunteerRole(
					participant.order_id,
					newRole,
				);

				if (!response.success) throw new Error(response.message);

				// Show success notification
				notifications.show({
					title: "Role updated!",
					message: `${participant.first_name}'s role updated to ${
						VOLUNTEER_ROLES.find((r) => r.value === newRole)?.label || newRole
					}`,
					color: "green",
					icon: <IconCheck size={16} />,
				});

				// Refresh data
				refetch();
				if (onRoleAssigned) onRoleAssigned();
			} catch (error) {
				// Show error notification
				notifications.show({
					title: "Error",
					message: "Failed to update role. Please try again.",
					color: "red",
					icon: <IconX size={16} />,
				});
			}
		},
		500,
	);

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
					<Tooltip label="Click dropdowns in the table to assign roles">
						<Badge color="blue" variant="dot" size="lg">
							Role Assignment Enabled
						</Badge>
					</Tooltip>
				)}
			</Group>

			{!canAssignRoles && !eventClosed && (
				<Alert icon={<IconInfoCircle size={16} />} color="blue" mb="md">
					Volunteer roles are assigned by trip leaders and administrators.
				</Alert>
			)}

			{eventClosed && (
				<Alert icon={<IconInfoCircle size={16} />} color="green" mb="md">
					This event has been finalized and archived. Volunteer roles are now
					frozen.
				</Alert>
			)}

			<Table striped>
				<Table.Thead>
					<Table.Tr>
						<Table.Th>Name</Table.Th>
						<Table.Th>Role</Table.Th>
						<Table.Th>Status</Table.Th>
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{participants.map((participant) => {
						const status = determineSignupStatus(participant);
						const currentRole = participant.order_meta?.cc_volunteer || "none";

						return (
							<Table.Tr key={participant.order_id}>
								<Table.Td>
									{participant.first_name} {participant.last_name}
								</Table.Td>
								<Table.Td>
									{canAssignRoles ? (
										<Select
											data={VOLUNTEER_ROLES}
											value={localRoles[participant.order_id] ?? currentRole}
											onChange={(value) => {
												if (value) {
													setSelectedParticipant(participant);
													setSelectedNewRole(value);
													setSelectedOldRole(currentRole);
													setIsRoleChangeModalOpen(true);
													setLocalRoles(prev => ({
														...prev,
														[participant.order_id]: value
													}));
												}
											}}
											placeholder="Select role"
											size="xs"
											allowDeselect={false}
										/>
									) : (
										<Badge
											color={currentRole === "none" ? "gray" : "green"}
											leftSection={
												currentRole !== "none" ? (
													<IconHeartHandshake size={14} />
												) : null
											}
										>
											{VOLUNTEER_ROLES.find((r) => r.value === currentRole)
												?.label || currentRole}
										</Badge>
									)}
								</Table.Td>
								<Table.Td>
									<Badge color={getStatusColor(status)}>{status}</Badge>
								</Table.Td>
							</Table.Tr>
						);
					})}
				</Table.Tbody>
			</Table>
			
			{/* Role Change Confirmation Modal */}
			<Modal
				opened={isRoleChangeModalOpen}
				onClose={() => {
					setIsRoleChangeModalOpen(false);
					if (selectedParticipant) {
						setLocalRoles(prev => {
							const newLocalRoles = {...prev};
							delete newLocalRoles[selectedParticipant.order_id];
							return newLocalRoles;
						});
					}
				}}
				title="Confirm Role Assignment" 
				centered
			>
				<Stack>
					<Text>
						You're about to assign <strong>{selectedNewRole}</strong> to{" "}
						<strong>{selectedParticipant?.first_name}</strong>
					</Text>
					
					{selectedOldRole !== "none" && (
						<Alert color="yellow" variant="light" icon={<IconInfoCircle size={16} />}>
							They were previously assigned <strong>{selectedOldRole}</strong>. We'll notify them of their new role, 
							but you may want to reach out directly to ensure they're aware of the change.
						</Alert>
					)}

					<Group justify="flex-end" mt="md">
						<Button 
							variant="default"
							onClick={() => {
								setIsRoleChangeModalOpen(false);
								if (selectedParticipant) {
									setLocalRoles(prev => {
										const newLocalRoles = {...prev};
										delete newLocalRoles[selectedParticipant.order_id];
										return newLocalRoles;
									});
								}
							}}
						>
							Cancel
						</Button>
						<Button
							color="blue"
							onClick={() => {
								if (selectedParticipant) {
									debouncedRoleUpdate(selectedParticipant, selectedNewRole);
									setIsRoleChangeModalOpen(false);
								}
							}}
						>
							Confirm
						</Button>
					</Group>
				</Stack>
			</Modal>
		</Paper>
}
