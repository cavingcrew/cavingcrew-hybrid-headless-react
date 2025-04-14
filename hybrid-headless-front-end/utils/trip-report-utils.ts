import type { Trip, TripParticipant } from "@/types/api";

/**
 * Adds ordinal suffix (st, nd, rd, th) to a day number.
 * @param day Day of the month (1-31)
 * @returns Day with ordinal suffix (e.g., "1st", "22nd")
 */
function getDayWithOrdinal(day: number): string {
	if (day > 3 && day < 21) return `${day}th`; // Covers 4th-20th
	switch (day % 10) {
		case 1:
			return `${day}st`;
		case 2:
			return `${day}nd`;
		case 3:
			return `${day}rd`;
		default:
			return `${day}th`;
	}
}

/**
 * Formats a date string with ordinal day and month.
 * @param dateString ISO date string
 * @returns Formatted date string (e.g., "Tuesday, 18th March") or null if invalid
 */
export function formatDateWithOrdinal(dateString?: string): string | null {
	if (!dateString) return null;
	try {
		const date = new Date(dateString);
		const options: Intl.DateTimeFormatOptions = {
			weekday: "long",
			month: "long",
		};
		const day = date.getDate();
		const formattedDate = date.toLocaleDateString("en-GB", options);
		// Insert the ordinal day into the formatted string
		return formattedDate.replace(
			date.toLocaleDateString("en-GB", { month: "long" }), // Find the month part
			`${getDayWithOrdinal(day)} ${date.toLocaleDateString("en-GB", { month: "long" })}`,
		);
	} catch {
		return null;
	}
}

/**
 * Formats a date range with ordinal days and month.
 * @param startDateString Start ISO date string
 * @param endDateString End ISO date string
 * @returns Formatted date range string (e.g., "12th-14th March") or null if invalid
 */
export function formatDateRangeWithOrdinal(
	startDateString?: string,
	endDateString?: string,
): string | null {
	if (!startDateString || !endDateString) return null;
	try {
		const startDate = new Date(startDateString);
		const endDate = new Date(endDateString);
		const startDay = startDate.getDate();
		const endDay = endDate.getDate();
		const month = startDate.toLocaleDateString("en-GB", { month: "long" });

		// Assuming range is within the same month for simplicity
		return `${getDayWithOrdinal(startDay)}-${getDayWithOrdinal(endDay)} ${month}`;
	} catch {
		return null;
	}
}

/**
 * Determines the time context of the trip (evening, day, weekend).
 * @param trip The Trip object
 * @returns "evening", "day", or "weekend"
 */
export function getTimeOfDay(trip: Trip): "evening" | "day" | "weekend" {
	if (trip.acf.event_type === "overnight") {
		return "weekend";
	}
	if (trip.acf.event_start_date_time) {
		try {
			const startHour = new Date(trip.acf.event_start_date_time).getHours();
			if (startHour >= 17) {
				return "evening";
			}
		} catch {
			// Ignore date parsing errors, fall back to 'day'
		}
	}
	return "day"; // Default to day trip
}

/**
 * Formats a list of names into a human-readable string with "and".
 * @param names Array of names
 * @returns Formatted string (e.g., "Tim", "Tim and Sarah", "Tim, Sarah and Bob")
 */
export function formatParticipantList(names: string[]): string {
	if (!names || names.length === 0) {
		return "";
	}
	if (names.length === 1) {
		return names[0];
	}
	if (names.length === 2) {
		return `${names[0]} and ${names[1]}`;
	}
	// More than 2 names: "A, B and C"
	const last = names.pop();
	return `${names.join(", ")} and ${last}`;
}

/**
 * Identifies trip leaders from a list of participants.
 * @param participants Array of TripParticipant objects
 * @returns Array of leader names
 */
export function getTripLeaders(participants: TripParticipant[]): string[] {
	return participants
		.filter((p) => p.order_meta?.cc_volunteer?.toLowerCase().includes("leader"))
		.map((p) => p.first_name)
		.filter((name): name is string => !!name); // Type guard to filter out undefined/null names
}

/**
 * Generates the summary sentence for a trip report.
 * @param trip The Trip object
 * @param participants Array of TripParticipant objects
 * @param canViewNames Boolean indicating if user can see full names
 * @returns The generated summary sentence string or a placeholder
 */
export function generateTripReportSummary(
	trip: Trip,
	participants: TripParticipant[],
	canViewNames: boolean,
): string {
	const timeContext = getTimeOfDay(trip);
	const formattedDate = formatDateWithOrdinal(trip.acf.event_start_date_time);
	const formattedDateRange = formatDateRangeWithOrdinal(
		trip.acf.event_start_date_time,
		trip.acf.event_finish_date_time,
	);

	const locationName =
		trip.route?.acf?.route_entrance_location_id?.title ||
		trip.acf.event_cave_name ||
		trip.acf.event_location ||
		"a location";

	const regionName =
		trip.route?.acf?.route_entrance_location_id?.acf?.location_caving_region
			?.post_title ||
		trip.acf.event_possible_location ||
		null;

	const routeName = trip.route?.acf?.route_name || null;

	if (!canViewNames || participants.length === 0) {
		// Fallback for logged-out users or no participant data yet
		const participantCount = participants.length; // Use actual length if available
		const peopleText =
			participantCount === 0
				? "Some people"
				: participantCount === 1
					? "1 person"
					: `${participantCount} people`;

		if (timeContext === "weekend") {
			return `On the weekend of ${formattedDateRange || "a weekend"}, ${peopleText} went to ${trip.hut?.hut_name || "the accommodation"}${regionName ? ` in ${regionName}` : ""}.`;
		}
		return `On ${formattedDate || "a date"}, ${peopleText} went to ${locationName}${regionName ? ` in ${regionName}` : ""}${routeName ? ` to explore the ${routeName} route` : ""}.`;
	}

	// Logged-in view with names
	const allNames = participants
		.map((p) => p.first_name)
		.filter((name): name is string => !!name);

	if (timeContext === "weekend") {
		// Overnight trip summary
		const leaderName = trip.acf.event_trip_leader || "Someone"; // Use defined leader for overnight
		const participantList = formatParticipantList(allNames);
		return `On the weekend of ${formattedDateRange || "a weekend"}, ${leaderName} led a trip to ${trip.hut?.hut_name || "the accommodation"}${regionName ? ` in ${regionName}` : ""}${participantList ? ` with ${participantList}` : ""}.`;
	}

	// Day/Evening trip summary
	const leaders = getTripLeaders(participants);
	const leaderList = formatParticipantList(leaders);
	const nonLeaders = allNames.filter((name) => !leaders.includes(name));
	const nonLeaderList = formatParticipantList(nonLeaders);

	const timePrefix = timeContext === "evening" ? "On the evening of " : "On ";

	if (leaderList && nonLeaderList) {
		return `${timePrefix}${formattedDate || "a date"}, ${leaderList} led ${nonLeaderList} to do ${routeName || locationName}${regionName ? ` in ${regionName}` : ""}.`;
	}
	if (leaderList && !nonLeaderList) {
		return `${timePrefix}${formattedDate || "a date"}, ${leaderList} led a trip to do ${routeName || locationName}${regionName ? ` in ${regionName}` : ""}.`;
	}
	// Fallback if no leader identified (shouldn't happen often for reports)
	return `${timePrefix}${formattedDate || "a date"}, ${formatParticipantList(allNames)} went to ${locationName}${regionName ? ` in ${regionName}` : ""}${routeName ? ` to explore the ${routeName} route` : ""}.`;
}

/**
 * Formats a role string for display.
 * Replaces underscores with spaces and capitalizes each word.
 * @param role The raw role string (e.g., "trip_leader", "evening_chef")
 * @returns Formatted role string (e.g., "Trip Leader", "Evening Chef") or empty string if invalid/none.
 */
export function formatRoleName(role?: string): string {
	if (!role || role === "none") return "";
	return role
		.replace(/_/g, " ") // Replace underscores with spaces
		.toLowerCase() // Convert to lowercase first to handle mixed cases
		.split(" ") // Split into words
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
		.join(" "); // Join back with spaces
}
