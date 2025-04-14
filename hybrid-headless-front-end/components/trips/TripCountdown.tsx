"use client";

import type { SignupTiming } from "@/utils/event-timing";
import { Box, Group, Paper, Text, useMantineTheme } from "@mantine/core";
import { IconClockHour4 } from "@tabler/icons-react";
import { useEffect, useState } from "react";

interface TripCountdownProps {
	signupTiming: SignupTiming;
	hasAvailability: boolean; // Needed to hide countdown if trip is full
}

// Helper function to format time remaining
const formatTimeRemaining = (ms: number) => {
	const totalSeconds = Math.floor(ms / 1000);
	const days = Math.floor(totalSeconds / (24 * 60 * 60));
	const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
	const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
	const seconds = totalSeconds % 60;

	let result = "";
	if (days > 0) result += `${days}d `;
	if (hours > 0 || days > 0) result += `${hours}h `;
	if (minutes > 0 || hours > 0 || days > 0) result += `${minutes}m `;
	result += `${seconds}s`;

	return result.trim();
};

export function TripCountdown({
	signupTiming,
	hasAvailability,
}: TripCountdownProps) {
	const theme = useMantineTheme();
	const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
	const [label, setLabel] = useState<string>("");

	useEffect(() => {
		const calculateRemaining = () => {
			const now = new Date().getTime();
			let targetDate: Date | null = null;
			let currentLabel = "";
			let showCountdown = false;

			// Determine target date and label based on status
			if (signupTiming.status === "early" && signupTiming.opensAt) {
				targetDate = signupTiming.opensAt;
				currentLabel = "Opens for signup in";
				showCountdown = true;
			} else if (
				signupTiming.status === "open" &&
				signupTiming.closesAt &&
				hasAvailability // Only show closing countdown if places are available
			) {
				const fourteenDaysInMillis = 14 * 24 * 60 * 60 * 1000;
				if (signupTiming.closesAt.getTime() - now <= fourteenDaysInMillis) {
					targetDate = signupTiming.closesAt;
					currentLabel = "Signup closes in";
					showCountdown = true;
				}
			}

			if (showCountdown && targetDate) {
				const remaining = targetDate.getTime() - now;
				setTimeRemaining(remaining > 0 ? remaining : 0);
				setLabel(currentLabel);
			} else {
				setTimeRemaining(null); // Hide countdown
				setLabel("");
			}
		};

		calculateRemaining(); // Initial calculation
		const intervalId = setInterval(calculateRemaining, 1000); // Update every second

		return () => clearInterval(intervalId); // Cleanup interval on unmount
	}, [signupTiming, hasAvailability]);

	if (timeRemaining === null || timeRemaining <= 0) {
		return null; // Don't render if no time remaining or countdown shouldn't be shown
	}

	return (
		<Paper withBorder p="md" radius="md" mb="xl" bg={theme.colors.blue[0]}>
			<Group justify="center" gap="xs">
				<IconClockHour4 size={20} color={theme.colors.blue[6]} />
				<Text fw={500} c="blue.6">
					{label}:
				</Text>
				<Text fw={700} c="blue.7" size="lg">
					{formatTimeRemaining(timeRemaining)}
				</Text>
			</Group>
		</Paper>
	);
}
