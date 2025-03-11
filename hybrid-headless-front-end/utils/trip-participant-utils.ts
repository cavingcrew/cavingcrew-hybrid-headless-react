/**
 * Utility functions for trip participants
 */
import type { TripParticipant } from "../types/api";

/**
 * Format participant count for display
 * @param count The number of participants
 * @param accessLevel The user's access level ('public', 'logged_in', 'participant', or 'admin')
 * @returns A formatted string for display
 */
export const formatParticipantCount = (
	count: number,
	accessLevel: string,
): string => {
	if (count === 0) return "No participants yet";
	if (count === 1) return "1 participant";
	return `${count} participants`;
};

/**
 * Determine signup status for a participant
 * @param participant The trip participant object
 * @returns A string representing the participant's status
 */
export const determineSignupStatus = (participant: TripParticipant): string => {
	const { cc_attendance: attendance } = participant.order_meta || {};
	const { order_status: orderStatus } = participant;

	// Comprehensive status mapping
	const statusMap: { [key: string]: string } = {
		attended: "Attended",
		noshow: "No Show",
		cancelled: "Cancelled",
		latebail: "Late Bail",
		"no-register-show": "Attended Without Signup",
		noregistershow: "Attended Without Signup",
	};

	// Check predefined statuses first
	if (attendance && typeof attendance === "string" && statusMap[attendance])
		return statusMap[attendance];

	// Handle pending and processing statuses
	if (orderStatus === "processing" && (!attendance || attendance === "pending"))
		return "Signed Up";

	if (orderStatus === "on-hold" || orderStatus === "pending") return "Other";

	return "Other";
};

/**
 * Get color for a participant status
 * @param status The status string
 * @returns A color string for the status
 */
export const getStatusColor = (status: string): string => {
	const colorMap: { [key: string]: string } = {
		Attended: "green",
		"No Show": "red",
		Cancelled: "gray",
		"Late Bail": "orange",
		"Signed Up": "blue",
		"Attended Without Signup": "teal",
		Other: "yellow",
	};

	return colorMap[status] || "yellow";
};

/**
 * Check if a participant is a first-time caver
 * @param participant The trip participant object
 * @returns Boolean indicating if this is their first trip
 */
export const isFirstTimeCaver = (participant: TripParticipant): boolean => {
	const attendedScore = participant.meta?.stats_attendance_attended_cached;
	return !attendedScore || attendedScore === "0" || attendedScore === "";
};

/**
 * Format a gear list for display
 * @param gearString A comma-separated string of gear items
 * @returns JSX for displaying the gear list
 */
export const formatGearList = (gearString?: string | null) => {
	if (!gearString) return { type: "p", props: { children: "None specified" } };

	const gearItems = gearString
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);

	return gearItems.length === 0
		? { type: "p", props: { children: "None specified" } }
		: {
				type: "ul",
				props: {
					children: gearItems.map((item, index) => ({
						type: "li",
						key: index,
						props: { children: item },
					})),
				},
			};
};

/**
 * Clean HTML tags from tackle requirements while preserving structure
 * @param tackleRequired HTML string of tackle requirements
 * @returns Cleaned string with preserved structure
 */
export const cleanTackle = (tackleRequired: string): string => {
	return (
		tackleRequired
			// Replace paragraph tags with newlines
			.replace(/\n/g, "")
			.replace(/<p>/g, "")
			.replace(/<\/p>/g, "\n")
			// Replace <br /> tags with newlines
			.replace(/<br\s*\/?>/g, "\n")
			// Remove any other HTML tags
			.replace(/<[^>]*>/g, "\n")
			// Trim extra whitespace
			.replace(/\n{3,}/g, "")
			.trim()
	);
};
