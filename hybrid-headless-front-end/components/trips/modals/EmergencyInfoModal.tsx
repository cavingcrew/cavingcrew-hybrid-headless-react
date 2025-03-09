"use client";

import {
	Alert,
	Box,
	Button,
	Group,
	Modal,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import React from "react";
import type { TripParticipant } from "../../../types/api";

interface EmergencyInfoModalProps {
	opened: boolean;
	onClose: () => void;
	participant: TripParticipant | null;
}

export function EmergencyInfoModal({
	opened,
	onClose,
	participant,
}: EmergencyInfoModalProps) {
	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={
				<Title order={4}>
					Emergency Contact - {participant?.first_name} {participant?.last_name}
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
				This is for emergency use by authorized people only - not just to be
				nosy. Access is logged.
			</Alert>

			{participant && (
				<Stack>
					<Group>
						<Text fw={700}>Full Name:</Text>
						<Text>
							{participant.first_name} {participant.last_name}
						</Text>
					</Group>

					<Group>
						<Text fw={700}>Phone Number:</Text>
						<Text>
							{participant.admin_meta?.["admin-phone-number"] ||
								participant.admin_meta?.["billing_phone"] ||
								"Not provided"}
						</Text>
					</Group>

					<Group align="flex-start">
						<Text fw={700}>Emergency Contact:</Text>
						<Box>
							<Text>
								{participant.admin_meta?.["admin-emergency-contact-name"] ||
									"Not provided"}
							</Text>
							<Text>
								{participant.admin_meta?.["admin-emergency-contact-phone"] ||
									"No phone provided"}
							</Text>
							<Text>
								{participant.admin_meta?.[
									"admin-emergency-contact-relationship"
								] || "Relationship not specified"}
							</Text>
						</Box>
					</Group>

					<Group align="flex-start">
						<Text fw={700}>Address:</Text>
						<Box>
							<Text>
								{participant.admin_meta?.["billing_address_1"] ||
									"Not provided"}
							</Text>
							{participant.admin_meta?.["billing_address_2"] && (
								<Text>{participant.admin_meta?.["billing_address_2"]}</Text>
							)}
							<Text>
								{[
									participant.admin_meta?.["billing_city"],
									participant.admin_meta?.["billing_postcode"],
								]
									.filter(Boolean)
									.join(", ")}
							</Text>
						</Box>
					</Group>

					<Group>
						<Text fw={700}>Date of Birth:</Text>
						<Text>
							{participant.admin_meta?.["admin-date-of-birth"] ||
								"Not provided"}
						</Text>
					</Group>

					<Group>
						<Text fw={700}>Car Registration:</Text>
						<Text>
							{participant.admin_meta?.["admin-car-registration"] ||
								"Not provided"}
						</Text>
					</Group>

					<Group align="flex-start">
						<Text fw={700}>Health Information:</Text>
						<Box>
							<Text>
								{participant.admin_meta?.[
									"admin-diet-allergies-health-extra-info"
								] || "None provided"}
							</Text>
							{participant.admin_meta?.["admin-health-shoulder"] === "yes" && (
								<Text c="red">Has shoulder issues</Text>
							)}
							{participant.admin_meta?.["admin-health-asthma"] === "yes" && (
								<Text c="red">Has asthma</Text>
							)}
							{participant.admin_meta?.["admin-health-missing-dose"] ===
								"yes" && (
								<Text c="red">
									Has medication that would be problematic if missed
								</Text>
							)}
							{participant.admin_meta?.[
								"admin-health-impairment-through-medication"
							] === "yes" && (
								<Text c="red">Takes medication that may cause impairment</Text>
							)}
						</Box>
					</Group>

					<Group justify="center" mt="md">
						<Button onClick={onClose}>Close</Button>
					</Group>
				</Stack>
			)}
		</Modal>
	);
}
