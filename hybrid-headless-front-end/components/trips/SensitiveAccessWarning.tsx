import {
	Alert,
	Group,
	List,
	Paper,
	Text,
	ThemeIcon,
	Tooltip,
} from "@mantine/core";
import {
	IconAlertTriangle,
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

				<Text fw={500} mt="md" mb="xs">
					Please avoid sharing:
				</Text>
				<List spacing="xs" mb="md">
					<List.Item>Photos of the site or entrance</List.Item>
					<List.Item>Location details or maps</List.Item>
					<List.Item>Site name on any social media</List.Item>
					<List.Item>
						Any information that could identify the location
					</List.Item>
				</List>

				<Group gap="md" mt="md">
					<Tooltip label="Do not share photos">
						<ThemeIcon color="red" size="lg" variant="light">
							<IconPhotoOff size={20} />
						</ThemeIcon>
					</Tooltip>
					<Tooltip label="Do not share location or maps">
						<ThemeIcon color="red" size="lg" variant="light">
							<IconMapOff size={20} />
						</ThemeIcon>
					</Tooltip>
					<Tooltip label="Do not share on social media">
						<ThemeIcon color="red" size="lg" variant="light">
							<IconShareOff size={20} />
						</ThemeIcon>
					</Tooltip>
				</Group>
			</Alert>
		</Paper>
	);
}
