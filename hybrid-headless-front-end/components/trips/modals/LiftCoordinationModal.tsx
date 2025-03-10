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
import React, { useEffect, useState } from "react";
import type { Trip, TripParticipant } from "../../../types/api";

interface LiftCoordinationModalProps {
	opened: boolean;
	onClose: () => void;
	liftCoordinationText: string;
	onTextChange: (text: string) => void;
	trip: Trip;
	participants: TripParticipant[];
}

export function LiftCoordinationModal({
	opened,
	onClose,
	liftCoordinationText,
	onTextChange,
	trip,
	participants,
}: LiftCoordinationModalProps) {
	// Generate lift coordination text when modal opens
	useEffect(() => {
		if (opened && !liftCoordinationText) {
			const generatedText = generateLiftCoordinationText(trip, participants);
			onTextChange(generatedText);
		}
	}, [opened, liftCoordinationText, onTextChange, trip, participants]);

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={<Title order={4}>Lift Coordination Message</Title>}
			size="lg"
		>
			<Alert
				icon={<IconInfoCircle size={16} />}
				color="blue"
				title="Group Message"
				mb="md"
			>
				This message helps coordinate lifts between participants. You can share
				it with the group to help arrange transportation.
			</Alert>

			<Textarea
				value={liftCoordinationText}
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
				<CopyButton value={liftCoordinationText} timeout={2000}>
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

/**
 * Generate lift coordination text for a trip
 * @param trip The trip object
 * @param participants List of trip participants
 * @returns Formatted lift coordination text
 */
function generateLiftCoordinationText(
	trip: Trip,
	participants: TripParticipant[],
): string {
	// Get signed up participants
	const signedUpParticipants = participants.filter((p) => {
		const status = p.order_meta?.cc_attendance;
		const orderStatus = p.order_status;
		return orderStatus === "processing" && (!status || status === "pending");
	});

	// Get trip date and location
	const tripDate = trip.acf.event_start_date_time
		? new Date(trip.acf.event_start_date_time).toLocaleDateString("en-GB", {
				weekday: "long",
				day: "numeric",
				month: "long",
			})
		: "the upcoming trip";

	const location =
		trip.route?.acf?.route_entrance_location_id?.acf?.location_name ||
		trip.route?.acf?.route_name ||
		trip.acf.event_cave_name ||
		trip.acf.event_location ||
		"our destination";

	// Find participants who need lifts
	const needLifts = signedUpParticipants.filter(
		(p) => p.meta?.["transport-need-lift"]?.toLowerCase() === "yes",
	);

	// Find participants who can give lifts
	const canGiveLifts = signedUpParticipants.filter(
		(p) => p.meta?.["transport-will-you-give-lift"]?.toLowerCase() === "yes",
	);

	// Find participants who prefer to car share
	const preferCarShare = signedUpParticipants.filter(
		(p) =>
			(p.meta?.["transport-need-lift"]?.toLowerCase() &&
				p.meta?.["transport-need-lift"]?.toLowerCase().indexOf("prefer") !==
					-1) ||
			(p.meta?.["transport-need-lift"]?.toLowerCase() &&
				p.meta?.["transport-need-lift"]?.toLowerCase().indexOf("share") !== -1),
	);

	// Build the message
	let message = `I've been checking the lift arrangements for ${tripDate} to ${location}.\n\n`;

	if (needLifts.length === 0 && preferCarShare.length === 0) {
		message +=
			"It looks like everyone has their transport sorted out. Great!\n";
	} else {
		if (needLifts.length > 0) {
			message += "The following people need lifts:\n";
			needLifts.forEach((p) => {
				const location =
					p.meta?.["transport-leaving-location"] || "location not specified";
				const time =
					p.meta?.["transport-depature-time"] || "time not specified";
				message += `- ${p.first_name} from ${location} (preferred departure: ${time})\n`;
			});
			message += "\n";
		}

		if (preferCarShare.length > 0) {
			message +=
				"The following people would prefer to car share rather than drive solo:\n";
			preferCarShare.forEach((p) => {
				const location =
					p.meta?.["transport-leaving-location"] || "location not specified";
				const time =
					p.meta?.["transport-depature-time"] || "time not specified";
				message += `- ${p.first_name} from ${location} (preferred departure: ${time})\n`;
			});
			message += "\n";
		}

		if (canGiveLifts.length > 0) {
			message += "The following people can offer lifts:\n";
			canGiveLifts.forEach((p) => {
				const location =
					p.meta?.["transport-leaving-location"] || "location not specified";
				const time =
					p.meta?.["transport-depature-time"] || "time not specified";
				message += `- ${p.first_name} from ${location} (departure: ${time})\n`;
			});
			message += "\n";
		}

		// Add suggestions for potential matches
		const potentialMatches = findPotentialMatches(needLifts, canGiveLifts);
		if (potentialMatches.length > 0) {
			message += "Potential lift arrangements based on locations:\n";

			// Group matches by location to avoid duplicates
			const locationGroups: Record<
				string,
				Array<{ driver: string; passenger: string }>
			> = {};

			potentialMatches.forEach((match) => {
				const locationKey = match.location.toLowerCase();
				if (!locationGroups[locationKey]) {
					locationGroups[locationKey] = [];
				}
				locationGroups[locationKey].push({
					driver: match.driver.first_name,
					passenger: match.passenger.first_name,
				});
			});

			// Output grouped matches
			for (const locationKey in locationGroups) {
				if (Object.hasOwn(locationGroups, locationKey)) {
					const matches = locationGroups[locationKey];
					// For each location, list all possible combinations
					matches.forEach((pair) => {
						message += `- ${pair.driver} could give a lift to ${pair.passenger}\n`;
					});
				}
			}

			message += "\n";
		}

		message +=
			"Could those offering lifts please coordinate with those needing lifts? And could everyone confirm their arrangements?\n\n";
	}

	message += "Thanks everyone!\n";
	return message;
}

/**
 * Find potential lift matches based on location
 */
interface PotentialMatch {
	driver: TripParticipant;
	passenger: TripParticipant;
	location: string;
}

function findPotentialMatches(
	needLifts: TripParticipant[],
	canGiveLifts: TripParticipant[],
): PotentialMatch[] {
	const matches: PotentialMatch[] = [];

	needLifts.forEach((passenger) => {
		const passengerLocation =
			passenger.meta?.["transport-leaving-location"]?.toLowerCase();
		if (!passengerLocation) return;

		canGiveLifts.forEach((driver) => {
			const driverLocation =
				driver.meta?.["transport-leaving-location"]?.toLowerCase();
			if (!driverLocation) return;

			// Check for location match (exact or partial)
			if (
				driverLocation === passengerLocation ||
				driverLocation.indexOf(passengerLocation) !== -1 ||
				passengerLocation.indexOf(driverLocation) !== -1
			) {
				// Use the more specific location description for the match
				const locationToUse =
					driverLocation.length >= passengerLocation.length
						? driver.meta?.["transport-leaving-location"]
						: passenger.meta?.["transport-leaving-location"];

				matches.push({
					driver,
					passenger,
					location: locationToUse || "",
				});
			}
		});
	});

	return matches;
}
