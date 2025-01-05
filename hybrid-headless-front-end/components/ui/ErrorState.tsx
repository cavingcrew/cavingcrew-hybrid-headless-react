import { Button, Center, Stack, Text } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import React from "react";

interface ErrorStateProps {
	message?: string;
	onRetry?: () => void;
}

export function ErrorState({
	message = "Something went wrong",
	onRetry,
}: ErrorStateProps) {
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
