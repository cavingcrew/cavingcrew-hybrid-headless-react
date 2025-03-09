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

interface EmergencyAccessModalProps {
	opened: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

export function EmergencyAccessModal({
	opened,
	onClose,
	onConfirm,
}: EmergencyAccessModalProps) {
	return (
		<Modal
			opened={opened}
			onClose={onClose}
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
				This is for emergency use by authorized people only - not just to be
				nosy. Access is logged.
			</Alert>

			<Text mb="md">
				Are you sure you need to access this confidential emergency information?
			</Text>

			<Group justify="center" mt="xl">
				<Button variant="outline" onClick={onClose}>
					Cancel
				</Button>
				<Button color="red" onClick={onConfirm}>
					Yes, I need this information
				</Button>
			</Group>
		</Modal>
	);
}
