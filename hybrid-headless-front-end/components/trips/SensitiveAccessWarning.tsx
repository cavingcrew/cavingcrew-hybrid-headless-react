import { Alert, Group, Paper, Text, ThemeIcon } from "@mantine/core";
import {
	IconAlertTriangle,
	IconBrandFacebook,
	IconMapOff,
	IconPhotoOff,
	IconShareOff,
} from "@tabler/icons-react";
import React from "react";

interface SensitiveAccessWarningProps {
	isVisible: boolean;
}

export function SensitiveAccessWarning({
	isVisible,
}: SensitiveAccessWarningProps) {
	if (!isVisible) return null;

	return (
		<Paper withBorder p="md" radius="md" mb="md">
			<Alert
				color="orange"
				title="SENSITIVE ACCESS LOCATION"
				icon={<IconAlertTriangle size={24} />}
				variant="outline"
			>
				<Text size="md" fw={500} mb="xs">
					Access to this site is sensitive. Do not post the name, location,
					entrance, photos, or mention this location on Facebook or any social
					media in any way.
				</Text>
				<Text mb="md">
					Doing so risks the whole caving community's access to this site, and
					is against the wishes of those who care for this site the most. Please
					respect this and respect the Crew. If you can't agree with this,
					please don't sign up for this trip.
				</Text>

				<Group gap="md" mt="md">
					<ThemeIcon color="red" size="lg" variant="light">
						<IconPhotoOff size={20} />
					</ThemeIcon>
					<ThemeIcon color="red" size="lg" variant="light">
						<IconMapOff size={20} />
					</ThemeIcon>
					<ThemeIcon color="red" size="lg" variant="light">
						<IconBrandFacebook size={20} />
					</ThemeIcon>
					<ThemeIcon color="red" size="lg" variant="light">
						<IconShareOff size={20} />
					</ThemeIcon>
				</Group>
			</Alert>
		</Paper>
	);
}
