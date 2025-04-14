import type { Trip } from "../types/api";

// --- Signup Timing Constants ---

// General Time Constants
const SUNDAY = 0; // Day of the week (0 = Sunday)
const MIDNIGHT_HOUR = 0;
const MIDDAY_HOUR = 12;
const EVENING_HOUR = 20; // 8 PM
const DAYS_IN_WEEK = 7;
const WEEKS_IN_MONTH_APPROX = 4.34; // Average for calculations
const DAYS_IN_6_WEEKS = 42;

// Overnight Trip Timing
const OVERNIGHT_OPEN_MONTHS_BEFORE = 4;
const OVERNIGHT_OPEN_DAY = SUNDAY;
const OVERNIGHT_OPEN_HOUR = EVENING_HOUR;
const OVERNIGHT_CLOSE_WEEKS_BEFORE = 1;
const OVERNIGHT_CLOSE_DAY = SUNDAY;
const OVERNIGHT_CLOSE_HOUR = EVENING_HOUR;

// Known/Mystery Trip Timing
const KNOWN_MYSTERY_OPEN_DAYS_BEFORE = DAYS_IN_6_WEEKS;
const KNOWN_MYSTERY_OPEN_HOUR = MIDNIGHT_HOUR;
const KNOWN_MYSTERY_CLOSE_DAYS_BEFORE = 1;
const KNOWN_MYSTERY_CLOSE_HOUR = MIDDAY_HOUR;

// Training/Giggletrip Timing
const TRAINING_GIGGLE_OPEN_DATE = new Date(0); // Epoch start (effectively always open)
const TRAINING_GIGGLE_CLOSE_DAYS_BEFORE = 1;
const TRAINING_GIGGLE_CLOSE_HOUR = MIDDAY_HOUR;

// Default Timing (if type doesn't match)
const DEFAULT_OPEN_MONTHS_BEFORE = 1;
const DEFAULT_CLOSE_DAYS_BEFORE = 1;
const DEFAULT_CLOSE_HOUR = MIDDAY_HOUR;

// Far Future Date for overrides (effectively never closes)
const FAR_FUTURE_DATE = new Date(8640000000000000);
// Epoch Start Date for overrides (effectively always open)
const EPOCH_START_DATE = new Date(0);

// --- Interfaces ---

export interface SignupTiming {
	opensAt: Date | null;
	closesAt: Date | null;
	isOpen: boolean;
	status: "early" | "open" | "closed" | "late";
}

export function isWithinDays(dateString: string, days: number): boolean {
	const eventDate = new Date(dateString);
	const today = new Date();
	const diffTime = eventDate.getTime() - today.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	return diffDays <= days && diffDays >= 0;
}

/**
 * Checks if a future date is within the next N days from now.
 * @param date The future date object.
 * @param days The number of days to check within.
 * @returns True if the date is within N days from now, false otherwise.
 */
export function isWithinNextDays(date: Date, days: number): boolean {
	const now = new Date();
	if (date <= now) return false; // Date must be in the future

	const diffTime = date.getTime() - now.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	return diffDays <= days;
}

export function getSignupTiming(trip: Trip): SignupTiming {
	const now = new Date();
	const startDate = trip.acf.event_start_date_time
		? new Date(trip.acf.event_start_date_time)
		: null;

	if (!startDate)
		return { opensAt: null, closesAt: null, isOpen: false, status: "closed" };

	// Initialize with start date copies
	let opensAt = new Date(startDate);
	let closesAt = new Date(startDate);

	switch (trip.acf.event_type) {
		case "overnight":
			// Open: Specific day/time, months before
			opensAt.setMonth(opensAt.getMonth() - OVERNIGHT_OPEN_MONTHS_BEFORE);
			// Adjust to the previous specified day (e.g., Sunday)
			opensAt.setDate(
				opensAt.getDate() -
					((opensAt.getDay() - OVERNIGHT_OPEN_DAY + DAYS_IN_WEEK) %
						DAYS_IN_WEEK),
			);
			opensAt.setHours(OVERNIGHT_OPEN_HOUR, 0, 0, 0);

			// Close: Specific day/time, weeks before
			closesAt.setDate(
				closesAt.getDate() - OVERNIGHT_CLOSE_WEEKS_BEFORE * DAYS_IN_WEEK,
			);
			// Adjust to the previous specified day (e.g., Sunday)
			closesAt.setDate(
				closesAt.getDate() -
					((closesAt.getDay() - OVERNIGHT_CLOSE_DAY + DAYS_IN_WEEK) %
						DAYS_IN_WEEK),
			);
			closesAt.setHours(OVERNIGHT_CLOSE_HOUR, 0, 0, 0);
			break;

		case "known": // Day/Evening/Mystery trips
		case "mystery":
			// Open: Fixed number of days before at a specific hour
			opensAt.setDate(opensAt.getDate() - KNOWN_MYSTERY_OPEN_DAYS_BEFORE);
			opensAt.setHours(KNOWN_MYSTERY_OPEN_HOUR, 0, 0, 0);

			// Close: Fixed number of days before at a specific hour
			closesAt.setDate(closesAt.getDate() - KNOWN_MYSTERY_CLOSE_DAYS_BEFORE);
			closesAt.setHours(KNOWN_MYSTERY_CLOSE_HOUR, 0, 0, 0);
			break;

		case "membership":
			// Effectively always open and never closes
			opensAt = EPOCH_START_DATE;
			closesAt = FAR_FUTURE_DATE;
			break;

		case "training":
		case "giggletrip":
			// Open: Effectively always open
			opensAt = TRAINING_GIGGLE_OPEN_DATE;

			// Close: Fixed number of days before at a specific hour
			closesAt.setDate(closesAt.getDate() - TRAINING_GIGGLE_CLOSE_DAYS_BEFORE);
			closesAt.setHours(TRAINING_GIGGLE_CLOSE_HOUR, 0, 0, 0);
			break;

		default:
			// Default: Open months before, close days before at specific hour
			opensAt.setMonth(opensAt.getMonth() - DEFAULT_OPEN_MONTHS_BEFORE);
			closesAt.setDate(closesAt.getDate() - DEFAULT_CLOSE_DAYS_BEFORE);
			closesAt.setHours(DEFAULT_CLOSE_HOUR, 0, 0, 0);
	}

	// Apply overrides - Allow signup effectively forever or from the beginning
	if (trip.acf.event_allow_early_signup) opensAt = EPOCH_START_DATE;
	if (trip.acf.event_allow_late_signup) closesAt = FAR_FUTURE_DATE;

	const isOpen = now >= opensAt && now <= closesAt;
	const status = now < opensAt ? "early" : now > closesAt ? "late" : "open";

	return { opensAt, closesAt, isOpen, status };
}
