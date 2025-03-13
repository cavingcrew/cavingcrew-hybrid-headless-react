import { Button, Center, Loader, Stack, Text } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import React, { useEffect, useState } from "react";

interface ErrorStateProps {
	message?: string;
	onRetry?: () => void;
	delayFull?: number; // Delay in ms before showing full error UI
}

export function ErrorState({
	message = "Something went wrong",
	onRetry,
	delayFull = 10000, // Default 10 seconds
}: ErrorStateProps) {
	const [showFullError, setShowFullError] = useState(false);
	
	useEffect(() => {
		// Set a timer to show the full error UI after the delay
		const timer = setTimeout(() => {
			setShowFullError(true);
		}, delayFull);
		
		// Clean up the timer if the component unmounts
		return () => clearTimeout(timer);
	}, [delayFull]);
	
	// Show a subtle loading state initially
	if (!showFullError) {
		return (
			<Center h={400}>
				<Stack align="center" gap="md">
					<Loader size="sm" color="gray" />
					<Text size="sm" c="dimmed">Loading...</Text>
				</Stack>
			</Center>
		);
	}
	
	// Show the full error UI after delay
	return (
		<Center h={400}>
			<Stack align="center" gap="md">
				<IconAlertCircle size={48} color="red" />
				<Text size="lg">{message}</Text>
				{onRetry && (
					<Button onClick={onRetry} variant="light">
						Try Again
					</Button>
				)}
			</Stack>
		</Center>
	);
}
