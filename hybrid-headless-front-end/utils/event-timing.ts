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
		return {
			opensAt: null,
			closesAt: null,
			isOpen: false,
			status: "closed",
		};

	// Calculate base open/close times based on event type
	let opensAt = new Date(startDate.getTime());
	let closesAt = new Date(startDate.getTime());

	switch (trip.acf.event_type) {
		case "overnight":
			opensAt.setMonth(opensAt.getMonth() - 2);
			opensAt.setHours(20, 0, 0, 0); // 8pm two months before
			closesAt.setDate(closesAt.getDate() - 7);
			closesAt.setHours(20, 0, 0, 0); // 8pm 1 week before
			break;

		case "known":
			opensAt.setMonth(opensAt.getMonth() - 2);
			closesAt.setDate(closesAt.getDate() - 1);
			closesAt.setHours(12, 0, 0, 0); // Noon day before
			break;

		case "training":
			opensAt.setMonth(opensAt.getMonth() - 1);
			closesAt.setDate(closesAt.getDate() - 3);
			break;

		default: // Defaults for other event types
			opensAt.setMonth(opensAt.getMonth() - 1);
			closesAt.setDate(closesAt.getDate() - 2);
	}

	// Apply overrides
	if (trip.acf.event_allow_early_signup) opensAt = new Date(0); // Epoch start
	if (trip.acf.event_allow_late_signup) closesAt = new Date(8640000000000000); // Far future

	const isOpen = now >= opensAt && now <= closesAt;
	const status = now < opensAt ? "early" : now > closesAt ? "late" : "open";

	return {
		opensAt,
		closesAt,
		isOpen,
		status,
	};
}
