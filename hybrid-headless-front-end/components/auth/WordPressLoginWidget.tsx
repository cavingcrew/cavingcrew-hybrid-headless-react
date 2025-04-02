"use client";

import { apiService } from "@/lib/api-service";
import { participantKeys } from "@/lib/hooks/useTripParticipants";
import { tripKeys } from "@/lib/hooks/useTrips";
import { userKeys } from "@/lib/hooks/useUser";
import {
	Alert,
	Button,
	Group,
	PasswordInput,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { IconLock, IconLogin, IconUser } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface WordPressLoginWidgetProps {
	redirectTo?: string;
	onSuccess?: () => void;
}

export function WordPressLoginWidget({
	redirectTo = typeof window !== "undefined" ? window.location.href : "/",
	onSuccess,
}: WordPressLoginWidgetProps) {
	const queryClient = useQueryClient();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		try {
			// Perform WordPress login
			const formData = new URLSearchParams();
			formData.append("log", username);
			formData.append("pwd", password);
			formData.append("rememberme", "forever");
			formData.append("redirect_to", redirectTo);

			const response = await fetch("/wp-login.php", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				credentials: "include",
				body: formData,
			});

			// Check if login was successful
			const userResponse = await apiService.getUser();

			if (userResponse.data?.isLoggedIn) {
				// Invalidate user query and any other related queries
				queryClient.invalidateQueries({ queryKey: userKeys.user() });
				queryClient.invalidateQueries({ queryKey: tripKeys.all });
				queryClient.invalidateQueries({ queryKey: participantKeys.all });
				onSuccess?.();
			} else {
				setError("Login failed - please check your credentials");
			}
		} catch (err) {
			setError("An error occurred during login. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<Stack gap="md">
				{error && (
					<Alert color="red" variant="light">
						{error}
					</Alert>
				)}

				<TextInput
					label="Email"
					value={username}
					onChange={(e) => setUsername(e.currentTarget.value)}
					required
					leftSection={<IconUser size={16} />}
					disabled={isLoading}
				/>

				<PasswordInput
					label="Password"
					value={password}
					onChange={(e) => setPassword(e.currentTarget.value)}
					required
					leftSection={<IconLock size={16} />}
					disabled={isLoading}
				/>

				<Group justify="space-between" mt="md">
					<Button
						type="submit"
						leftSection={<IconLogin size={16} />}
						loading={isLoading}
					>
						Log In
					</Button>

					<Text size="sm">
						<a
							href="/wp-login.php?action=lostpassword"
							style={{ textDecoration: "none" }}
						>
							Forgot password?
						</a>
					</Text>
				</Group>
			</Stack>
		</form>
	);
}
