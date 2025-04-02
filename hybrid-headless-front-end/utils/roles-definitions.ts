// Note: This is a temporary static definition. Eventually roles will be fetched from:
// GET /api/roles - Returns Role[] with complete role configurations

export type VolunteerRole = {
	value: string;
	label: string;
	description?: string;
	category:
		| "event_management"
		| "logistics"
		| "safety"
		| "hospitality"
		| "promotion"
		| "operations";
	requiredPermissions?: ("admin" | "trip_leader" | "committee")[];
	icon?: string;
};

export const VOLUNTEER_ROLES: VolunteerRole[] = [
	// Existing roles
	{
		value: "none",
		label: "No Role",
		category: "operations",
		description: "No assigned responsibilities",
	},
	{
		value: "trip_director",
		label: "Trip Director",
		category: "event_management",
		description: "Overall responsibility for trip organization and safety",
		requiredPermissions: ["admin", "committee"],
	},

	// New roles from CMS
	{
		value: "backseat_leader",
		label: "Backseat Leader",
		category: "safety",
		description: "Supports trip leadership with safety oversight and guidance",
	},
	{
		value: "overnight_gear_tackle",
		label: "Overnight Gear and Tackle Coordinator",
		category: "logistics",
		description: "Manages all gear and equipment for multi-day trips",
	},
	{
		value: "evening_gear_tackle",
		label: "Evening/Day Gear Coordinator",
		category: "logistics",
		description: "Coordinates equipment for single-day events",
	},
	{
		value: "washing_up",
		label: "Washing Up Coordinator",
		category: "hospitality",
		description: "Oversees cleanup operations after meals",
	},
	{
		value: "overnight_reporter",
		label: "Overnight Trip Reporter",
		category: "promotion",
		description: "Documents and shares experiences from multi-day trips",
	},
	{
		value: "day_trip_reporter",
		label: "Evening/Giggletrip/Day Reporter",
		category: "promotion",
		description: "Captures and shares moments from short trips",
	},
	{
		value: "evening_chef",
		label: "Evening Meal Chef",
		category: "hospitality",
		description: "Prepares main evening meal for groups",
	},
	{
		value: "breakfast_chef",
		label: "Breakfast Chef",
		category: "hospitality",
		description: "Manages morning meal preparation",
	},
	{
		value: "trip_leader",
		label: "Trip Leader",
		category: "event_management",
		description: "Leads trip activities and participant management",
		requiredPermissions: ["admin", "committee"],
	},
	{
		value: "seconder",
		label: "Seconder",
		category: "safety",
		description: "Assists leader with safety and logistics",
	},
	{
		value: "overnight_caving",
		label: "Overnight Caving Coordinator",
		category: "operations",
		description: "Manages caving activities for multi-day trips",
	},
	{
		value: "overnight_director",
		label: "Overnight Trip Director",
		category: "event_management",
		description: "Oversees all aspects of multi-day trips",
		requiredPermissions: ["admin"],
	},
	{
		value: "evening_day_director",
		label: "Evening/Weekend Day Director",
		category: "event_management",
		description: "Manages single-day trip operations",
		requiredPermissions: ["admin", "committee"],
	},
];

// Utility functions
export function getRoleDefinition(value: string): VolunteerRole | undefined {
	return VOLUNTEER_ROLES.find((role) => role.value === value);
}

export function getRolesByCategory(
	category: VolunteerRole["category"],
): VolunteerRole[] {
	return VOLUNTEER_ROLES.filter((role) => role.category === category);
}

export function getRoleLabel(value: string): string {
	return getRoleDefinition(value)?.label || value;
}
