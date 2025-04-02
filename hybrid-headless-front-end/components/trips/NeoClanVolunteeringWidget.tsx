"use client";

import React from 'react';
import {
	ActionIcon,
	Alert,
	Anchor,
	Badge,
	Box,
	Button,
	CopyButton,
	Group,
	List,
	Paper,
	Skeleton,
	Stack,
	Table,
	Tabs,
	Text,
	ThemeIcon,
	Title,
	Tooltip,
} from "@mantine/core";
import {
	IconAlertCircle,
	IconAlertTriangle,
	IconCar,
	IconChartBar,
	IconCheck,
	IconFileDescription,
	IconHeartHandshake,
	IconInfoCircle,
	IconMedicalCross,
	IconMessage,
	IconSchool,
	IconShield,
	IconTools,
	IconUsers,
	IconX,
} from "@tabler/icons-react";
import React, { useState } from "react";
import { cleanHtmlEntities } from "@/utils/string-utils";
import { WordPressLoginWidget } from "@/components/auth/WordPressLoginWidget";
import { NeoClanVolunteeringRoles } from "./NeoClanVolunteeringRoles";

// Import custom hooks and types
import { useTripParticipants } from "@/lib/hooks/useTripParticipants";
import { useUser } from "@/lib/hooks/useUser";
import type { Trip, TripParticipant } from "@/types/api";
import { Auth } from "@/utils/user-utils";
import type { AccessLevel } from "@/utils/user-utils";

// Define props interface for the component
interface NeoClanVolunteeringWidgetProps {
	trip: Trip;
}

import { formatRelativeTime } from "@/utils/date-utils";
import {
	getSkillDefinition,
	getSkillDescription,
	getSkillInfoUrl,
	getSkillLabel,
} from "@/utils/skill-definitions";
import {
	generateCalloutText,
	generateGearTripCheckText,
	generateLocationInfoText,
	generateTackleRequestText,
} from "@/utils/trip-admin-utils";
import {
	cleanTackle,
	determineSignupStatus,
	formatGearList,
	formatParticipantCount,
	getStatusColor,
	isFirstTimeCaver,
	requiresMembership,
} from "@/utils/trip-participant-utils";
import {
	CalloutModal,
	EmergencyAccessModal,
	EmergencyInfoModal,
	GearTripCheckModal,
	LiftCoordinationModal,
	LocationInfoModal,
	TackleRequestModal,
} from "./modals";

// Main component with improved structure and comments
export function NeoClanVolunteeringWidget({
	trip,
}: NeoClanVolunteeringWidgetProps) {
	// State management for tabs and modal
	const [activeTab, setActiveTab] = useState<string | null>("cavers");
	const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
	const [selectedParticipant, setSelectedParticipant] =
		useState<TripParticipant | null>(null);
	const [confirmEmergencyAccess, setConfirmEmergencyAccess] = useState(false);
	const [calloutModalOpen, setCalloutModalOpen] = useState(false);
	const [calloutText, setCalloutText] = useState("");
	const [tackleRequestModalOpen, setTackleRequestModalOpen] = useState(false);
	const [tackleRequestText, setTackleRequestText] = useState("");
	const [gearTripCheckModalOpen, setGearTripCheckModalOpen] = useState(false);
	const [gearTripCheckText, setGearTripCheckText] = useState("");
	const [liftCoordinationModalOpen, setLiftCoordinationModalOpen] =
		useState(false);
	const [liftCoordinationText, setLiftCoordinationText] = useState("");
	const [locationInfoModalOpen, setLocationInfoModalOpen] = useState(false);
	const [locationInfoText, setLocationInfoText] = useState("");

	// Fetch trip participants data
	const { data, isLoading, error, refetch } = useTripParticipants(trip.id);
	const { user } = useUser();
	const isLoggedIn = Auth.isLoggedIn(user);

	// Extract participants and access level with default fallbacks
	const participants = data?.data?.participants || [];
	const accessLevel = (data?.data?.access_level || "public") as
		| "public"
		| "logged_in"
		| "participant"
		| "event_role"
		| "admin"
		| "super_admin";

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
				<Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
					Failed to load people's information. It probably isn't your fault. :)
					Please try again later.
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
		setLiftCoordinationText(""); // Reset text to trigger auto-generation
		setLiftCoordinationModalOpen(true);
	};

	// Function to generate location info text
	const handleGenerateLocationInfoText = () => {
		const text = generateLocationInfoText(trip);
		setLocationInfoText(text);
		setLocationInfoModalOpen(true);
	};

	// Render different views based on access level
	const renderAccessLevelView = () => {
		switch (accessLevel) {
			case "public":
				return renderPublicView();
			case "logged_in":
				return renderLoggedInView();
			case "participant":
			case "event_role":
				return renderParticipantView();
			case "admin":
			case "super_admin":
				return renderAdminView();
			default:
				return renderPublicView();
		}
	};

	// Check if user is signed up but not a member
	const isSignedUpNonMember = () => {
		return (
			Auth.isLoggedIn(user) &&
			!Auth.isMember(user) &&
			data?.data?.access_level === "logged_in" &&
			data?.data?.participants?.length > 0
		);
	};

	// Public view - minimal information (no names)
	const renderPublicView = () => (
		<Paper withBorder p="md" radius="md">
			<Title order={3} mb="md">
				Who's Coming
			</Title>
			{data?.data?.participant_count === 0 || !data?.data?.participant_count ? (
				<Text c="dimmed">No one has signed up yet. Be the first!</Text>
			) : (
				<>
					<Group gap="xs" mb="xs">
						<Badge color="blue">
							{formatParticipantCount(
								data?.data?.participant_count || 0,
								"public",
							)}
						</Badge>
					</Group>
					<Text size="sm" c="dimmed" mb="md">
						Sign in to see who's coming
					</Text>

					<Box mt="md">
						<Title order={5} mb="sm">
							Sign In
						</Title>
						<WordPressLoginWidget
							redirectTo={
								typeof window !== "undefined" ? window.location.href : "/"
							}
						/>
					</Box>
				</>
			)}
		</Paper>
	);

	// Logged in view - shows first names only
	const renderLoggedInView = () => (
		<Paper withBorder p="md" radius="md">
			<Title order={3} mb="md">
				Who's Coming
			</Title>
			{participants.length === 0 ? (
				<Text c="dimmed">No one has signed up yet. Be the first!</Text>
			) : (
				<>
					<Group gap="xs" mb="xs">
						<Badge color="blue">
							{formatParticipantCount(participants.length, accessLevel)}
						</Badge>
					</Group>
					<Group gap="xs" mb="md">
						{participants.map((participant, index) => (
							<Badge key={index} variant="outline">
								{participant.first_name}
							</Badge>
						))}
					</Group>

					{isSignedUpNonMember() && (
						<Alert
							color="yellow"
							title="Membership and Sign Up Required"
							mb="md"
						>
							You need to be a member and signed up for this trip to see more
							details.
						</Alert>
					)}
				</>
			)}
		</Paper>
	);

	// Participant view - more details but still limited
	const renderParticipantView = () => (
		<Paper withBorder p="md" radius="md">
			<Group justify="space-between" mb="md">
				<Title order={3}>People confirmed for this trip</Title>
				{accessLevel === "event_role" && (
					<Badge color="teal" size="lg">
						Event Role Access
					</Badge>
				)}
			</Group>
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
									<Table.Td>
										{participant.first_name} {participant.last_name}
									</Table.Td>
									<Table.Td>
										{participant.meta?.["skills-horizontal"] || "Not specified"}
									</Table.Td>
									<Table.Td>
										{participant.order_meta?.cc_volunteer &&
										participant.order_meta.cc_volunteer !== "none" &&
										participant.order_meta.cc_volunteer !== "" ? (
											<Badge color="green">
												{participant.order_meta.cc_volunteer}
											</Badge>
										) : (
											"None"
										)}
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
				<Badge
					color={accessLevel === "super_admin" ? "violet" : "blue"}
					size="lg"
				>
					{accessLevel === "super_admin"
						? "Super Admin Access"
						: "Admin Access"}
				</Badge>
				<Alert
					color="blue"
					variant="light"
					title="Private Information"
					styles={{
						root: {
							marginTop: "0.5rem",
						},
						wrapper: {
							flexWrap: "wrap",
						},
						title: {
							fontWeight: 600,
						},
					}}
				>
					This administrative information is only visible to you and other trip
					organisers
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
							<Tabs.Tab
								value="dietary"
								leftSection={<IconInfoCircle size={14} />}
							>
								Dietary Requirements
							</Tabs.Tab>
							<Tabs.Tab value="transport" leftSection={<IconCar size={14} />}>
								Lift Sharing
							</Tabs.Tab>
							<Tabs.Tab
								value="health"
								leftSection={<IconMedicalCross size={14} />}
							>
								Health & Dietary
							</Tabs.Tab>
							<Tabs.Tab
								value="roles"
								leftSection={<IconHeartHandshake size={14} />}
							>
								Roles & Volunteering
							</Tabs.Tab>
							<Tabs.Tab value="stats" leftSection={<IconChartBar size={14} />}>
								Stats
							</Tabs.Tab>
							<Tabs.Tab
								value="emergency"
								leftSection={<IconShield size={14} />}
							>
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
									mr="xs"
								>
									Gear Trip Check
								</Button>
								<Button
									leftSection={<IconMessage size={16} />}
									onClick={handleGenerateLocationInfoText}
									variant="outline"
									color="green"
								>
									Location Info Message
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
												<Table.Td>
													{participant.first_name} {participant.last_name}
												</Table.Td>
												<Table.Td>
													<Badge color={getStatusColor(status)}>{status}</Badge>
												</Table.Td>
												<Table.Td>
													{firstTimer ? (
														<Badge color="red" variant="light">
															First Timer
														</Badge>
													) : (
														"No"
													)}
												</Table.Td>
												<Table.Td>
													{participant.order_meta?.cc_volunteer &&
													participant.order_meta.cc_volunteer !== "none" ? (
														<Badge color="green">
															{participant.order_meta.cc_volunteer}
														</Badge>
													) : (
														"None"
													)}
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
										{(trip.acf.event_skills_required?.indexOf("SRT") !== -1 ||
											trip.acf.event_skills_required === "other") && (
											<>
												<Table.Th>SRT Skills</Table.Th>
												<Table.Th>Leading SRT</Table.Th>
											</>
										)}
										<Table.Th>Leading Horizontal</Table.Th>
										<Table.Th>Leading Coaching</Table.Th>
									</Table.Tr>
								</Table.Thead>
								<Table.Tbody>
									{[...participants]
										.sort((a, b) => {
											// Sort by horizontal skills (most competent first)
											const horizontalSkillOrder: Record<string, number> = {
												"Horizontal Intermediate": 3,
												"Horizontal Basic": 2,
												"New to caving": 1,
												"Not specified": 0,
											};

											const aHorizontalSkill =
												a.meta?.["skills-horizontal"] || "Not specified";
											const bHorizontalSkill =
												b.meta?.["skills-horizontal"] || "Not specified";

											const aHorizontalValue =
												horizontalSkillOrder[aHorizontalSkill as string] || 0;
											const bHorizontalValue =
												horizontalSkillOrder[bHorizontalSkill as string] || 0;

											if (aHorizontalValue !== bHorizontalValue) {
												return bHorizontalValue - aHorizontalValue;
											}

											// If horizontal skills are the same, sort by SRT skills
											const srtSkillOrder: Record<string, number> = {
												"SRT Advanced": 6,
												"SRT Intermediate": 5,
												"Pre-SRT Intermediate": 4,
												"SRT Basic": 3,
												"Pre-SRT Basic": 2,
												"No-SRT": 1,
												"Not specified": 0,
											};

											const aSrtSkill =
												a.meta?.["skills-srt"] || "Not specified";
											const bSrtSkill =
												b.meta?.["skills-srt"] || "Not specified";

											const aSrtValue = srtSkillOrder[aSrtSkill as string] || 0;
											const bSrtValue = srtSkillOrder[bSrtSkill as string] || 0;

											if (aSrtValue !== bSrtValue) {
												return bSrtValue - aSrtValue;
											}

											// If SRT skills are the same, sort by leading horizontal
											const leadingHorizontalOrder: Record<string, number> = {
												"Horizontal Leader": 4,
												"learner leader": 3,
												seconder: 2,
												"no skills": 1,
												"Not specified": 0,
											};

											const aLeadingHorizontal =
												a.meta?.["skills-leading-horizontal"] ||
												a.meta?.["caving-horizontal-happy-to-second-or-lead"] ||
												"Not specified";
											const bLeadingHorizontal =
												b.meta?.["skills-leading-horizontal"] ||
												b.meta?.["caving-horizontal-happy-to-second-or-lead"] ||
												"Not specified";

											const aLeadingHorizontalValue =
												leadingHorizontalOrder[aLeadingHorizontal as string] ||
												0;
											const bLeadingHorizontalValue =
												leadingHorizontalOrder[bLeadingHorizontal as string] ||
												0;

											if (aLeadingHorizontalValue !== bLeadingHorizontalValue) {
												return (
													bLeadingHorizontalValue - aLeadingHorizontalValue
												);
											}

											// If leading horizontal skills are the same, sort by leading SRT
											const leadingSrtOrder: Record<string, number> = {
												"srt leader advanced": 5,
												"srt leader basic": 4,
												"I'm learning to rig": 3,
												"I can help derig": 2,
												"Nothing yet": 1,
												"Not specified": 0,
											};

											const aLeadingSrt =
												a.meta?.["skills-leading-srt"] ||
												a.meta?.["caving-srt-happy-to-second-or-lead"] ||
												"Not specified";
											const bLeadingSrt =
												b.meta?.["skills-leading-srt"] ||
												b.meta?.["caving-srt-happy-to-second-or-lead"] ||
												"Not specified";

											const aLeadingSrtValue =
												leadingSrtOrder[aLeadingSrt as string] || 0;
											const bLeadingSrtValue =
												leadingSrtOrder[bLeadingSrt as string] || 0;

											if (aLeadingSrtValue !== bLeadingSrtValue) {
												return bLeadingSrtValue - aLeadingSrtValue;
											}

											// If all else is equal, sort by name
											return (a.first_name || "").localeCompare(
												b.first_name || "",
											);
										})
										.map((participant) => (
											<Table.Tr key={participant.order_id}>
												<Table.Td>
													{participant.first_name} {participant.last_name}
												</Table.Td>
												<Table.Td>
													{participant.meta?.["skills-horizontal"] ? (
														<Tooltip
															label={getSkillDescription(
																"horizontalSkills",
																participant.meta["skills-horizontal"],
															)}
															disabled={
																!getSkillDescription(
																	"horizontalSkills",
																	participant.meta["skills-horizontal"],
																)
															}
														>
															<Badge
																color={
																	getSkillDefinition(
																		"horizontalSkills",
																		participant.meta["skills-horizontal"],
																	)?.color || "blue"
																}
																variant="light"
																component={
																	getSkillInfoUrl(
																		"horizontalSkills",
																		participant.meta["skills-horizontal"],
																	)
																		? "a"
																		: "div"
																}
																href={getSkillInfoUrl(
																	"horizontalSkills",
																	participant.meta["skills-horizontal"],
																)}
																target="_blank"
																style={{
																	cursor: getSkillInfoUrl(
																		"horizontalSkills",
																		participant.meta["skills-horizontal"],
																	)
																		? "pointer"
																		: "default",
																}}
															>
																{getSkillLabel(
																	"horizontalSkills",
																	participant.meta["skills-horizontal"],
																)}
															</Badge>
														</Tooltip>
													) : (
														<Text c="dimmed">Not specified</Text>
													)}
												</Table.Td>
												{(trip.acf.event_skills_required?.indexOf("SRT") !==
													-1 ||
													trip.acf.event_skills_required === "other") && (
													<>
														<Table.Td>
															{participant.meta?.["skills-srt"] ? (
																<Tooltip
																	label={getSkillDescription(
																		"srtSkills",
																		participant.meta["skills-srt"],
																	)}
																	disabled={
																		!getSkillDescription(
																			"srtSkills",
																			participant.meta["skills-srt"],
																		)
																	}
																>
																	<Badge
																		color={
																			getSkillDefinition(
																				"srtSkills",
																				participant.meta["skills-srt"],
																			)?.color || "blue"
																		}
																		variant="light"
																		component={
																			getSkillInfoUrl(
																				"srtSkills",
																				participant.meta["skills-srt"],
																			)
																				? "a"
																				: "div"
																		}
																		href={getSkillInfoUrl(
																			"srtSkills",
																			participant.meta["skills-srt"],
																		)}
																		target="_blank"
																		style={{
																			cursor: getSkillInfoUrl(
																				"srtSkills",
																				participant.meta["skills-srt"],
																			)
																				? "pointer"
																				: "default",
																		}}
																	>
																		{getSkillLabel(
																			"srtSkills",
																			participant.meta["skills-srt"],
																		)}
																	</Badge>
																</Tooltip>
															) : (
																<Text c="dimmed">Not specified</Text>
															)}
														</Table.Td>
														<Table.Td>
															{participant.meta?.["skills-leading-srt"] ||
															participant.meta?.[
																"caving-srt-happy-to-second-or-lead"
															] ? (
																<Tooltip
																	label={getSkillDescription(
																		"leadingSrtSkills",
																		participant.meta["skills-leading-srt"] ||
																			participant.meta[
																				"caving-srt-happy-to-second-or-lead"
																			],
																	)}
																	disabled={
																		!getSkillDescription(
																			"leadingSrtSkills",
																			participant.meta["skills-leading-srt"] ||
																				participant.meta[
																					"caving-srt-happy-to-second-or-lead"
																				],
																		)
																	}
																>
																	<Badge
																		color={
																			getSkillDefinition(
																				"leadingSrtSkills",
																				participant.meta[
																					"skills-leading-srt"
																				] ||
																					participant.meta[
																						"caving-srt-happy-to-second-or-lead"
																					],
																			)?.color || "orange"
																		}
																		variant="light"
																		component={
																			getSkillInfoUrl(
																				"leadingSrtSkills",
																				participant.meta[
																					"skills-leading-srt"
																				] ||
																					participant.meta[
																						"caving-srt-happy-to-second-or-lead"
																					],
																			)
																				? "a"
																				: "div"
																		}
																		href={getSkillInfoUrl(
																			"leadingSrtSkills",
																			participant.meta["skills-leading-srt"] ||
																				participant.meta[
																					"caving-srt-happy-to-second-or-lead"
																				],
																		)}
																		target="_blank"
																		style={{
																			cursor: getSkillInfoUrl(
																				"leadingSrtSkills",
																				participant.meta[
																					"skills-leading-srt"
																				] ||
																					participant.meta[
																						"caving-srt-happy-to-second-or-lead"
																					],
																			)
																				? "pointer"
																				: "default",
																		}}
																	>
																		{getSkillLabel(
																			"leadingSrtSkills",
																			participant.meta["skills-leading-srt"] ||
																				participant.meta[
																					"caving-srt-happy-to-second-or-lead"
																				],
																		)}
																	</Badge>
																</Tooltip>
															) : (
																<Text c="dimmed">Not specified</Text>
															)}
														</Table.Td>
													</>
												)}
												<Table.Td>
													{participant.meta?.["skills-leading-horizontal"] ||
													participant.meta?.[
														"caving-horizontal-happy-to-second-or-lead"
													] ? (
														<Tooltip
															label={getSkillDescription(
																"leadingHorizontalSkills",
																participant.meta["skills-leading-horizontal"] ||
																	participant.meta[
																		"caving-horizontal-happy-to-second-or-lead"
																	],
															)}
															disabled={
																!getSkillDescription(
																	"leadingHorizontalSkills",
																	participant.meta[
																		"skills-leading-horizontal"
																	] ||
																		participant.meta[
																			"caving-horizontal-happy-to-second-or-lead"
																		],
																)
															}
														>
															<Badge
																color={
																	getSkillDefinition(
																		"leadingHorizontalSkills",
																		participant.meta[
																			"skills-leading-horizontal"
																		] ||
																			participant.meta[
																				"caving-horizontal-happy-to-second-or-lead"
																			],
																	)?.color || "teal"
																}
																variant="light"
																component={
																	getSkillInfoUrl(
																		"leadingHorizontalSkills",
																		participant.meta[
																			"skills-leading-horizontal"
																		] ||
																			participant.meta[
																				"caving-horizontal-happy-to-second-or-lead"
																			],
																	)
																		? "a"
																		: "div"
																}
																href={getSkillInfoUrl(
																	"leadingHorizontalSkills",
																	participant.meta[
																		"skills-leading-horizontal"
																	] ||
																		participant.meta[
																			"caving-horizontal-happy-to-second-or-lead"
																		],
																)}
																target="_blank"
																style={{
																	cursor: getSkillInfoUrl(
																		"leadingHorizontalSkills",
																		participant.meta[
																			"skills-leading-horizontal"
																		] ||
																			participant.meta[
																				"caving-horizontal-happy-to-second-or-lead"
																			],
																	)
																		? "pointer"
																		: "default",
																}}
															>
																{getSkillLabel(
																	"leadingHorizontalSkills",
																	participant.meta[
																		"skills-leading-horizontal"
																	] ||
																		participant.meta[
																			"caving-horizontal-happy-to-second-or-lead"
																		],
																)}
															</Badge>
														</Tooltip>
													) : (
														<Text c="dimmed">Not specified</Text>
													)}
												</Table.Td>
												<Table.Td>
													{participant.meta?.["skills-leading-coaching"] ? (
														<Tooltip
															label={getSkillDescription(
																"leadingCoachingSkills",
																participant.meta["skills-leading-coaching"],
															)}
															disabled={
																!getSkillDescription(
																	"leadingCoachingSkills",
																	participant.meta["skills-leading-coaching"],
																)
															}
														>
															<Badge
																color={
																	getSkillDefinition(
																		"leadingCoachingSkills",
																		participant.meta["skills-leading-coaching"],
																	)?.color || "grape"
																}
																variant="light"
																component={
																	getSkillInfoUrl(
																		"leadingCoachingSkills",
																		participant.meta["skills-leading-coaching"],
																	)
																		? "a"
																		: "div"
																}
																href={getSkillInfoUrl(
																	"leadingCoachingSkills",
																	participant.meta["skills-leading-coaching"],
																)}
																target="_blank"
																style={{
																	cursor: getSkillInfoUrl(
																		"leadingCoachingSkills",
																		participant.meta["skills-leading-coaching"],
																	)
																		? "pointer"
																		: "default",
																}}
															>
																{getSkillLabel(
																	"leadingCoachingSkills",
																	participant.meta["skills-leading-coaching"],
																)}
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
									Required gear for this trip:{" "}
									{trip.route?.acf?.route_personal_gear_required
										? typeof trip.route.acf.route_personal_gear_required ===
											"string"
											? trip.route.acf.route_personal_gear_required
													.replace(/<[^>]*>/g, "")
													.trim()
													.replace(/,/g, ", ")
											: String(
													trip.route.acf.route_personal_gear_required,
												).replace(/,/g, ", ")
										: trip.acf.event_gear_required || "None specified"}
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
									{participants
										.map((participant) => {
											// Parse gear bringing from participant meta
											const gearBringing =
												participant.meta?.[
													"gear-bringing-evening-or-day-trip"
												] || "";
											const welliesSize =
												participant.meta?.gear_wellies_size || "";

											// Parse individual items they're bringing
											const bringingItems = gearBringing
												.split(",")
												.map((item) => item.trim())
												.filter(Boolean);

											// Check if they're a new caver
											const isNewCaver = bringingItems.some(
												(item) =>
													item.indexOf("Nothing") !== -1 ||
													item.indexOf("totally new") !== -1,
											);

											// Determine required gear based on trip type
											const requiresSRT =
												trip.acf.event_gear_required?.indexOf("SRT") !== -1 ||
												trip.acf.event_skills_required?.indexOf("SRT") !== -1 ||
												trip.route?.acf?.route_personal_gear_required?.indexOf(
													"SRT",
												) !== -1;

											// Get route personal gear requirements
											const routePersonalGear =
												trip.route?.acf?.route_personal_gear_required || "";

											// Get required gear from route if available, otherwise use standard list
											let standardGear: string[] = [];

											if (routePersonalGear) {
												// Parse from route_personal_gear_required
												standardGear = (
													typeof routePersonalGear === "string"
														? routePersonalGear.replace(/<[^>]*>/g, "")
														: String(routePersonalGear)
												)
													.split(/[,;]/)
													.map((item) => item.trim())
													.filter(Boolean);
											} else {
												// Default standard gear
												standardGear = [
													"Oversuit",
													"Undersuit",
													"Helmet and Light",
													"Kneepads",
													"Gloves",
													"Wellies",
												];

												// Add SRT Kit if required for this trip
												if (requiresSRT) {
													standardGear.push("SRT Kit");
													if (
														gearBringing.indexOf("SRT Kit") === -1 &&
														gearBringing.indexOf("Harness and Cowstails") === -1
													) {
														standardGear.push("Harness and Cowstails");
													}
												}
											}

											// Calculate how many items they have and how many they need
											let itemsHaveCount = 0;
											let itemsNeedCount = 0;

											// Check each standard gear item
											standardGear.forEach((item) => {
												// Skip checking if they're a new caver claiming to bring nothing
												if (isNewCaver && item !== "Wellies") {
													itemsNeedCount++;
													return;
												}

												// Special case for SRT Kit and Harness/Cowstails
												if (
													item === "Harness and Cowstails" ||
													item === "SRT Kit"
												) {
													// If they have SRT Kit, they have Harness and Cowstails covered
													const hasSRTKit = bringingItems.some(
														(g) => g.toLowerCase().indexOf("srt kit") !== -1,
													);

													// If they have Harness and Cowstails specifically
													const hasHarnessAndCowstails = bringingItems.some(
														(g) =>
															g.toLowerCase().indexOf("harness") !== -1 &&
															g.toLowerCase().indexOf("cowstail") !== -1,
													);

													// If they have either SRT Kit or Harness and Cowstails, they're covered
													if (
														(item === "SRT Kit" && hasSRTKit) ||
														(item === "Harness and Cowstails" &&
															(hasSRTKit || hasHarnessAndCowstails))
													) {
														itemsHaveCount++;
													} else {
														itemsNeedCount++;
													}
												} else if (item === "Helmet and Light") {
													// Special case for Helmet and Light
													// Check for combined "Helmet and Light" item
													const hasHelmetAndLight = bringingItems.some(
														(g) =>
															g.toLowerCase().indexOf("helmet and light") !==
															-1,
													);

													if (hasHelmetAndLight) {
														itemsHaveCount++;
													} else {
														// Check for separate helmet and light items (not spare light)
														const hasHelmet = bringingItems.some(
															(g) => g.toLowerCase().indexOf("helmet") !== -1,
														);
														const hasLight = bringingItems.some(
															(g) =>
																g.toLowerCase().indexOf("light") !== -1 &&
																g.toLowerCase().indexOf("spare") === -1,
														);

														if (hasHelmet && hasLight) {
															itemsHaveCount++;
														} else {
															itemsNeedCount++;
														}
													}
												} else {
													// For all other items, check if they're bringing it
													const hasBrought = bringingItems.some(
														(g) =>
															g.toLowerCase().indexOf(item.toLowerCase()) !==
															-1,
													);

													if (hasBrought) {
														itemsHaveCount++;
													} else {
														itemsNeedCount++;
													}
												}
											});

											// Return participant with gear counts for sorting
											return {
												participant,
												itemsHaveCount,
												itemsNeedCount,
												gearCompleteness:
													itemsHaveCount / (itemsHaveCount + itemsNeedCount),
											};
										})
										// Sort by gear completeness (most complete first)
										.sort((a, b) => b.gearCompleteness - a.gearCompleteness)
										.map(({ participant }) => {
											// Parse gear bringing from participant meta
											const gearBringing =
												participant.meta?.[
													"gear-bringing-evening-or-day-trip"
												] || "";
											const welliesSize =
												participant.meta?.gear_wellies_size || "";

											// Parse individual items they're bringing
											const bringingItems = gearBringing
												.split(",")
												.map((item) => item.trim())
												.filter(Boolean);

											// Check if they're a new caver
											const isNewCaver = bringingItems.some(
												(item) =>
													item.indexOf("Nothing") !== -1 ||
													item.indexOf("totally new") !== -1,
											);

											// Determine required gear based on trip type
											const requiresSRT =
												trip.acf.event_gear_required?.indexOf("SRT") !== -1 ||
												trip.acf.event_skills_required?.indexOf("SRT") !== -1 ||
												(typeof trip.route?.acf
													?.route_personal_gear_required === "string" &&
													trip.route?.acf?.route_personal_gear_required?.indexOf(
														"SRT",
													) !== -1);

											// Get route personal gear requirements
											const routePersonalGear =
												trip.route?.acf?.route_personal_gear_required || "";

											// Get required gear from route if available, otherwise use standard list
											let standardGear: string[] = [];

											if (routePersonalGear) {
												// Parse from route_personal_gear_required
												standardGear = (
													typeof routePersonalGear === "string"
														? routePersonalGear.replace(/<[^>]*>/g, "")
														: String(routePersonalGear)
												)
													.split(/[,;]/)
													.map((item) => item.trim())
													.filter(Boolean);
											} else {
												// Default standard gear
												standardGear = [
													"Oversuit",
													"Undersuit",
													"Helmet and Light",
													"Kneepads",
													"Gloves",
													"Wellies",
												];

												// Add SRT Kit if required for this trip
												if (requiresSRT) {
													standardGear.push("SRT Kit");
													if (
														gearBringing.indexOf("SRT Kit") === -1 &&
														gearBringing.indexOf("Harness and Cowstails") === -1
													) {
														standardGear.push("Harness and Cowstails");
													}
												}
											}

											// Check what gear the participant is missing
											const missingGear: string[] = [];

											// Check each standard gear item
											standardGear.forEach((item) => {
												// Skip checking if they're a new caver claiming to bring nothing
												if (isNewCaver && item !== "Wellies") {
													missingGear.push(item);
													return;
												}

												// Special case for SRT Kit and Harness/Cowstails
												if (
													item === "Harness and Cowstails" ||
													item === "SRT Kit"
												) {
													// If they have SRT Kit, they have Harness and Cowstails covered
													const hasSRTKit = bringingItems.some(
														(g) => g.toLowerCase().indexOf("srt kit") !== -1,
													);

													// If they have Harness and Cowstails specifically
													const hasHarnessAndCowstails = bringingItems.some(
														(g) =>
															g.toLowerCase().indexOf("harness") !== -1 &&
															g.toLowerCase().indexOf("cowstail") !== -1,
													);

													// If they have either SRT Kit or Harness and Cowstails, they're covered
													if (
														(item === "SRT Kit" && hasSRTKit) ||
														(item === "Harness and Cowstails" &&
															(hasSRTKit || hasHarnessAndCowstails))
													) {
														return; // They have this covered
													}
												} else if (item === "Helmet and Light") {
													// Special case for Helmet and Light
													// Check for combined "Helmet and Light" item
													const hasHelmetAndLight = bringingItems.some(
														(g) =>
															g.toLowerCase().indexOf("helmet and light") !==
															-1,
													);

													if (hasHelmetAndLight) {
														return; // They have a combined helmet and light
													}

													// Check for separate helmet and light items (not spare light)
													const hasHelmet = bringingItems.some(
														(g) => g.toLowerCase().indexOf("helmet") !== -1,
													);
													const hasLight = bringingItems.some(
														(g) =>
															g.toLowerCase().indexOf("light") !== -1 &&
															g.toLowerCase().indexOf("spare") === -1,
													);

													if (hasHelmet && hasLight) {
														return; // They have both helmet and light
													}
												} else {
													// For all other items, check if they're bringing it
													const hasBrought = bringingItems.some(
														(g) =>
															g.toLowerCase().indexOf(item.toLowerCase()) !==
															-1,
													);

													if (hasBrought) {
														return; // They have this item
													}
												}

												// If we get here, they need this item
												if (item === "Wellies") {
													if (welliesSize && welliesSize.trim() !== "") {
														missingGear.push(`Wellies size ${welliesSize}`);
													} else {
														missingGear.push("Wellies (size unknown)");
													}
												} else {
													missingGear.push(item);
												}
											});

											// Check for additional gear beyond requirements
											const additionalGear = bringingItems.filter((item) => {
												// Skip if it's the "Nothing" option
												if (
													item.toLowerCase().indexOf("Nothing") !== -1 ||
													item.toLowerCase().indexOf("totally new") !== -1
												) {
													return false;
												}

												// Skip items that are part of the standard gear list
												for (const req of standardGear) {
													// Handle special cases first
													if (req === "Helmet and Light") {
														// Only match exact "Helmet and Light" or separate helmet/light items
														// Don't match "Spare Light" as part of required gear
														if (
															item.toLowerCase() === "helmet and light" ||
															item.toLowerCase() === "helmet" ||
															(item.toLowerCase().indexOf("light") !== -1 &&
																item.toLowerCase().indexOf("spare") === -1)
														) {
															return false;
														}
														// Continue checking other requirements
														continue;
													}

													// Standard comparison
													if (
														item.toLowerCase().indexOf(req.toLowerCase()) !== -1
													) {
														return false;
													}
												}

												// If we get here, this is additional gear
												return true;
											});

											// Check if rope is needed for this trip
											const tripRequiresRope =
												(typeof trip.route?.acf?.route_group_tackle_required ===
													"string" &&
													trip.route?.acf?.route_group_tackle_required
														?.toLowerCase()
														.indexOf("rope") !== -1) ||
												(typeof trip.acf.event_gear_required === "string" &&
													trip.acf.event_gear_required
														?.toLowerCase()
														.indexOf("srt") !== -1);

											return (
												<Table.Tr key={participant.order_id}>
													<Table.Td>
														{participant.first_name} {participant.last_name}
													</Table.Td>
													<Table.Td>
														{bringingItems.length === 0 ? (
															<Text>None specified</Text>
														) : (
															<Stack gap="xs">
																{bringingItems
																	.filter((item) => {
																		// Only show items that match required gear
																		if (
																			item.includes("Nothing") ||
																			item.includes("totally new")
																		) {
																			return true; // Always show "Nothing" options
																		}

																		// Check if this item is in the required list
																		return standardGear.some((req) => {
																			// Handle special cases first
																			if (req === "Helmet and Light") {
																				// Only match exact "Helmet and Light" or separate helmet/light items
																				// Don't match "Spare Light" as part of required gear
																				if (
																					item.toLowerCase() ===
																						"helmet and light" ||
																					item.toLowerCase() === "helmet" ||
																					(item
																						.toLowerCase()
																						.indexOf("light") !== -1 &&
																						item
																							.toLowerCase()
																							.indexOf("spare") === -1)
																				) {
																					return true;
																				}
																				return false;
																			}

																			// Special case for SRT Kit and Harness/Cowstails
																			if (
																				(req === "SRT Kit" ||
																					req === "Harness and Cowstails") &&
																				(item
																					.toLowerCase()
																					.indexOf("srt kit") !== -1 ||
																					(item
																						.toLowerCase()
																						.indexOf("harness") !== -1 &&
																						item
																							.toLowerCase()
																							.indexOf("cowstail") !== -1))
																			) {
																				return true;
																			}

																			// Standard comparison
																			return (
																				item
																					.toLowerCase()
																					.indexOf(req.toLowerCase()) !== -1
																			);
																		});
																	})
																	.map((item, index) => (
																		<Badge
																			key={index}
																			color={
																				item.includes("Nothing")
																					? "red"
																					: "blue"
																			}
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
																{!welliesSize &&
																	missingGear.some((g) =>
																		g.includes("Wellies"),
																	) && (
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
																{bringingItems.some(
																	(item) =>
																		item.toLowerCase().indexOf("rope") !== -1,
																) &&
																!standardGear.some(
																	(item) =>
																		item.toLowerCase().indexOf("rope") !== -1,
																) ? (
																	<Badge color="teal" variant="light">
																		{participant.meta?.["gear-rope-length"]
																			? `Rope: ${participant.meta["gear-rope-length"]}`
																			: "Ropes (length not specified)"}
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
								<Alert
									icon={<IconInfoCircle size={16} />}
									color="blue"
									title="Equipment Legend"
								>
									<Group gap="md">
										<Badge color="red" variant="light">
											Missing required gear
										</Badge>
										<Badge color="green">All required gear</Badge>
										<Badge color="teal" variant="light">
											Additional gear
										</Badge>
										<Badge color="orange" variant="light">
											Information needed
										</Badge>
									</Group>
								</Alert>

								{trip.acf.event_gear_required?.indexOf("SRT") !== -1 && (
									<Alert
										icon={<IconInfoCircle size={16} />}
										color="yellow"
										mt="md"
									>
										This trip requires SRT equipment. Ensure all people have
										proper vertical caving gear.
									</Alert>
								)}

								{participants.some(
									(p) =>
										p.meta?.["gear-bringing-evening-or-day-trip"]?.indexOf(
											"Nothing",
										) !== -1 ||
										p.meta?.["gear-bringing-evening-or-day-trip"]?.indexOf(
											"totally new",
										) !== -1,
								) && (
									<Alert
										icon={<IconInfoCircle size={16} />}
										color="red"
										mt="md"
									>
										Some people are new and need full equipment. Please
										coordinate gear loans.
									</Alert>
								)}

								{participants.some((p) => {
									// Check if this participant needs wellies but hasn't specified size
									const gearBringing =
										p.meta?.["gear-bringing-evening-or-day-trip"] || "";
									const hasWelliesSize = !!p.meta?.gear_wellies_size;
									const needsWellies = gearBringing.indexOf("Wellies") === -1;
									return needsWellies && !hasWelliesSize;
								}) && (
									<Alert
										icon={<IconInfoCircle size={16} />}
										color="orange"
										mt="md"
									>
										Some people need wellies but haven't specified their size.
										Please check with them.
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
									{[...participants]
										.sort((a, b) => {
											// Get dietary requirements
											const aDiet = cleanHtmlEntities(
												a.meta?.["admin-dietary-requirements"] || "",
											).toLowerCase();
											const bDiet = cleanHtmlEntities(
												b.meta?.["admin-dietary-requirements"] || "",
											).toLowerCase();

											// Sort vegan and vegetarian together at the top
											if (
												aDiet.indexOf("vegan") !== -1 &&
												bDiet.indexOf("vegan") === -1
											)
												return -1;
											if (
												aDiet.indexOf("vegan") === -1 &&
												bDiet.indexOf("vegan") !== -1
											)
												return 1;
											if (
												aDiet.indexOf("vegetarian") !== -1 &&
												bDiet.indexOf("vegetarian") === -1
											)
												return -1;
											if (
												aDiet.indexOf("vegetarian") === -1 &&
												bDiet.indexOf("vegetarian") !== -1
											)
												return 1;

											// Then sort by whether they have any dietary requirements
											if (aDiet && !bDiet) return -1;
											if (!aDiet && bDiet) return 1;

											// If both have or don't have dietary requirements, sort alphabetically by name
											return (a.first_name || "").localeCompare(
												b.first_name || "",
											);
										})
										.map((participant) => (
											<Table.Tr key={participant.order_id}>
												<Table.Td>
													{participant.first_name} {participant.last_name}
												</Table.Td>
												<Table.Td>
													{cleanHtmlEntities(
														participant.meta?.["admin-dietary-requirements"],
													) || "None specified"}
												</Table.Td>
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
									{[...participants]
										.sort((a, b) => {
											// Sort by needs lift (yes at top)
											const aNeedsLift =
												a.meta?.["transport-need-lift"]?.toLowerCase() ===
												"yes";
											const bNeedsLift =
												b.meta?.["transport-need-lift"]?.toLowerCase() ===
												"yes";

											if (aNeedsLift && !bNeedsLift) return -1;
											if (!aNeedsLift && bNeedsLift) return 1;

											// Then sort by can give lift (yes at top)
											const aCanGiveLift =
												a.meta?.[
													"transport-will-you-give-lift"
												]?.toLowerCase() === "yes";
											const bCanGiveLift =
												b.meta?.[
													"transport-will-you-give-lift"
												]?.toLowerCase() === "yes";

											if (aCanGiveLift && !bCanGiveLift) return -1;
											if (!aCanGiveLift && bCanGiveLift) return 1;

											// Then sort by location
											const aLocation =
												a.meta?.["transport-leaving-location"] || "";
											const bLocation =
												b.meta?.["transport-leaving-location"] || "";

											if (aLocation && !bLocation) return -1;
											if (!aLocation && bLocation) return 1;
											if (aLocation !== bLocation)
												return aLocation.localeCompare(bLocation);

											// Finally sort by name
											return (a.first_name || "").localeCompare(
												b.first_name || "",
											);
										})
										.map((participant) => (
											<Table.Tr key={participant.order_id}>
												<Table.Td>
													{participant.first_name} {participant.last_name}
												</Table.Td>
												<Table.Td>
													{participant.meta?.[
														"transport-need-lift"
													]?.toLowerCase() === "yes" ? (
														<Badge color="red">Needs Lift</Badge>
													) : (
														<Text c="dimmed">No</Text>
													)}
												</Table.Td>
												<Table.Td>
													{participant.meta?.[
														"transport-will-you-give-lift"
													]?.toLowerCase() === "yes" ? (
														<Text>Yes</Text>
													) : (
														<Text c="dimmed">No</Text>
													)}
												</Table.Td>
												<Table.Td>
													{participant.meta?.["transport-depature-time"] || (
														<Text c="dimmed">Not specified</Text>
													)}
												</Table.Td>
												<Table.Td>
													{participant.meta?.["transport-leaving-location"] || (
														<Text c="dimmed">Not specified</Text>
													)}
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
									{[...participants]
										.sort((a, b) => {
											// Count health flags for each participant
											const aHealthFlags = [
												a.admin_meta?.["admin-health-shoulder"] === "yes",
												a.admin_meta?.["admin-health-asthma"] === "yes",
												a.admin_meta?.["admin-health-missing-dose"] === "yes",
												a.admin_meta?.[
													"admin-health-impairment-through-medication"
												] === "yes",
											].filter(Boolean).length;

											const bHealthFlags = [
												b.admin_meta?.["admin-health-shoulder"] === "yes",
												b.admin_meta?.["admin-health-asthma"] === "yes",
												b.admin_meta?.["admin-health-missing-dose"] === "yes",
												b.admin_meta?.[
													"admin-health-impairment-through-medication"
												] === "yes",
											].filter(Boolean).length;

											// Sort by number of health flags (most first)
											if (aHealthFlags !== bHealthFlags) {
												return bHealthFlags - aHealthFlags;
											}

											// Then sort by dietary requirements (vegan/vegetarian first)
											const aDiet = cleanHtmlEntities(
												a.meta?.["admin-dietary-requirements"] || "",
											).toLowerCase();
											const bDiet = cleanHtmlEntities(
												b.meta?.["admin-dietary-requirements"] || "",
											).toLowerCase();

											if (
												aDiet.indexOf("vegan") !== -1 &&
												bDiet.indexOf("vegan") === -1
											)
												return -1;
											if (
												aDiet.indexOf("vegan") === -1 &&
												bDiet.indexOf("vegan") !== -1
											)
												return 1;
											if (
												aDiet.indexOf("vegetarian") !== -1 &&
												bDiet.indexOf("vegetarian") === -1
											)
												return -1;
											if (
												aDiet.indexOf("vegetarian") === -1 &&
												bDiet.indexOf("vegetarian") !== -1
											)
												return 1;

											// Then sort by whether they have any dietary requirements
											if (aDiet && !bDiet) return -1;
											if (!aDiet && bDiet) return 1;

											// Finally sort by name
											return (a.first_name || "").localeCompare(
												b.first_name || "",
											);
										})
										.map((participant) => (
											<Table.Tr key={participant.order_id}>
												<Table.Td>
													{participant.first_name} {participant.last_name}
												</Table.Td>
												<Table.Td>
													{cleanHtmlEntities(
														participant.meta?.["admin-dietary-requirements"],
													) || "None specified"}
												</Table.Td>
												<Table.Td>
													{cleanHtmlEntities(
														participant.admin_meta?.[
															"admin-diet-allergies-health-extra-info"
														],
													) || "None provided"}
												</Table.Td>
												<Table.Td>
													<Stack gap="xs">
														{participant.admin_meta?.[
															"admin-health-shoulder"
														] === "yes" && (
															<Badge color="red" variant="light">
																Shoulder Issues
															</Badge>
														)}
														{participant.admin_meta?.["admin-health-asthma"] ===
															"yes" && (
															<Badge color="red" variant="light">
																Asthma
															</Badge>
														)}
														{participant.admin_meta?.[
															"admin-health-missing-dose"
														] === "yes" && (
															<Badge color="red" variant="light">
																Critical Medication
															</Badge>
														)}
														{participant.admin_meta?.[
															"admin-health-impairment-through-medication"
														] === "yes" && (
															<Badge color="red" variant="light">
																Medication Impairment
															</Badge>
														)}
														{(() => {
															const entries: Array<
																[string, string | null | undefined]
															> = [];
															if (participant.admin_meta) {
																for (const key in participant.admin_meta) {
																	if (
																		participant.admin_meta.hasOwnProperty(key)
																	) {
																		entries.push([
																			key,
																			participant.admin_meta[key],
																		]);
																	}
																}
															}

															return entries
																.filter(
																	([key, value]) =>
																		key.indexOf("admin-health-") === 0 &&
																		key !== "admin-health-shoulder" &&
																		key !== "admin-health-asthma" &&
																		key !== "admin-health-missing-dose" &&
																		key !==
																			"admin-health-impairment-through-medication" &&
																		value === "yes",
																)
																.map(([key]) => (
																	<Badge
																		key={key}
																		color="orange"
																		variant="light"
																	>
																		{key
																			.replace("admin-health-", "")
																			.split("-")
																			.map(
																				(word) =>
																					word.charAt(0).toUpperCase() +
																					word.slice(1),
																			)
																			.join(" ")}
																	</Badge>
																));
														})()}
													</Stack>
												</Table.Td>
											</Table.Tr>
										))}
								</Table.Tbody>
							</Table>
						</Tabs.Panel>

						<Tabs.Panel value="roles" pt="xs">
							<NeoClanVolunteeringRoles
								trip={trip}
								onRoleAssigned={() => {
									// Refresh participants data when a role is assigned
									refetch();
								}}
							/>
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
											<Table.Td>
												{participant.first_name} {participant.last_name}
											</Table.Td>
											<Table.Td>
												{participant.meta?.[
													"stats_attendance_attended_cached"
												] || "0"}
											</Table.Td>
											<Table.Td>
												{formatRelativeTime(
													participant.meta?.[
														"cc_compliance_last_date_of_caving"
													],
												)}
											</Table.Td>
											<Table.Td>
												{participant.meta?.["scores_volunteer_score_cached"] ? (
													<Badge
														color={
															Number.parseFloat(
																participant.meta[
																	"scores_volunteer_score_cached"
																],
															) > 0.7
																? "green"
																: Number.parseFloat(
																			participant.meta[
																				"scores_volunteer_score_cached"
																			],
																		) > 0.4
																	? "yellow"
																	: "red"
														}
													>
														{participant.meta["scores_volunteer_score_cached"]}
													</Badge>
												) : (
													"N/A"
												)}
											</Table.Td>
											<Table.Td>
												{participant.meta?.[
													"scores_attendance_reliability_score_cached"
												] ? (
													<Badge
														color={
															Number.parseFloat(
																participant.meta[
																	"scores_attendance_reliability_score_cached"
																],
															) > 0.7
																? "green"
																: Number.parseFloat(
																			participant.meta[
																				"scores_attendance_reliability_score_cached"
																			],
																		) > 0.4
																	? "yellow"
																	: "red"
														}
													>
														{
															participant.meta[
																"scores_attendance_reliability_score_cached"
															]
														}
													</Badge>
												) : (
													"N/A"
												)}
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
								This information is for emergency use by authorized people only.
								Access is logged.
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
											<Table.Td>
												{participant.first_name} {participant.last_name}
											</Table.Td>
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

					<LocationInfoModal
						opened={locationInfoModalOpen}
						onClose={() => setLocationInfoModalOpen(false)}
						locationInfoText={locationInfoText}
						onTextChange={setLocationInfoText}
						trip={trip}
					/>
				</>
			)}
		</Paper>
	);

	return renderAccessLevelView();
}
