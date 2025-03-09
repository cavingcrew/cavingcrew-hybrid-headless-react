"use client";

import {
	Alert,
	Button,
	CopyButton,
	Group,
	Modal,
	Text,
	Textarea,
	Title,
} from "@mantine/core";
import { IconCopy, IconInfoCircle } from "@tabler/icons-react";
import React from "react";
import type { Trip } from "../../../types/api";

interface GearTripCheckModalProps {
	opened: boolean;
	onClose: () => void;
	gearCheckText: string;
	onTextChange: (text: string) => void;
	trip: Trip;
}

export function GearTripCheckModal({
	opened,
	onClose,
	gearCheckText,
	onTextChange,
	trip,
}: GearTripCheckModalProps) {
	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={<Title order={4}>Gear Trip Check</Title>}
			size="lg"
		>
			<Alert
				icon={<IconInfoCircle size={16} />}
				color="blue"
				title="Group Message"
				mb="md"
			>
				This message summarizes the gear needs for your trip participants. You can share it with the group to confirm everyone has what they need.
			</Alert>

			<Text fw={500} mb="xs">
				Required Gear:
			</Text>
			<Text mb="md" style={{ whiteSpace: "pre-line" }}>
				{trip.acf.event_gear_required
					? typeof trip.acf.event_gear_required === "string"
						? trip.acf.event_gear_required
								.replace(/<br\s*\/?>/gi, "\n\n")
								.replace(/<\/p>\s*<p>/gi, "\n\n")
								.replace(/<\/?p>/gi, "\n\n")
								.replace(/\n{3,}/g, "\n\n")
						: String(trip.acf.event_gear_required)
					: "None specified"}
			</Text>

			<Textarea
				value={gearCheckText}
				onChange={(e) => onTextChange(e.currentTarget.value)}
				minRows={10}
				autosize
				mb="md"
				styles={{
					input: {
						whiteSpace: "pre-line",
					},
				}}
			/>

			<Group justify="space-between" mt="md">
				<Button onClick={onClose}>Close</Button>
				<CopyButton value={gearCheckText} timeout={2000}>
					{({ copied, copy }) => (
						<Button
							color={copied ? "teal" : "blue"}
							onClick={copy}
							leftSection={<IconCopy size={16} />}
						>
							{copied ? "Copied to clipboard" : "Copy to clipboard"}
						</Button>
					)}
				</CopyButton>
			</Group>
		</Modal>
	);
}
