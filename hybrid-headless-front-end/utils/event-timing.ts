import type { Trip } from "../types/api";

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
			// Open: Previous Sunday 8pm, two months before
			opensAt.setMonth(opensAt.getMonth() - 2);
			opensAt.setDate(opensAt.getDate() - opensAt.getDay()); // Previous Sunday
			opensAt.setHours(20, 0, 0, 0); // 8pm

			// Close: Previous Sunday 8pm, one week before
			closesAt.setDate(closesAt.getDate() - 7);
			closesAt.setDate(closesAt.getDate() - closesAt.getDay()); // Previous Sunday
			closesAt.setHours(20, 0, 0, 0);
			break;

		case "known": // Day/Evening/Mystery trips
		case "mystery":
			// Open: 6 weeks before at midnight
			opensAt.setDate(opensAt.getDate() - 42);
			opensAt.setHours(0, 0, 0, 0);

			// Close: Midday the day before
			closesAt.setDate(closesAt.getDate() - 1);
			closesAt.setHours(12, 0, 0, 0);
			break;

		case "membership":
			// Always open
			opensAt = new Date(0); // Epoch start
			closesAt = new Date(8640000000000000); // Far future
			break;

		case "training":
		case "giggletrip":
			// Open: Very early (epoch start)
			opensAt = new Date(0);

			// Close: Midday the day before
			closesAt.setDate(closesAt.getDate() - 1);
			closesAt.setHours(12, 0, 0, 0);
			break;

		default:
			// Default to 1 month open window
			opensAt.setMonth(opensAt.getMonth() - 1);
			closesAt.setDate(closesAt.getDate() - 1);
			closesAt.setHours(12, 0, 0, 0);
	}

	// Apply overrides
	if (trip.acf.event_allow_early_signup) opensAt = new Date(0); // Epoch start
	if (trip.acf.event_allow_late_signup) closesAt = new Date(8640000000000000); // Far future

	const isOpen = now >= opensAt && now <= closesAt;
	const status = now < opensAt ? "early" : now > closesAt ? "late" : "open";

	return { opensAt, closesAt, isOpen, status };
}
