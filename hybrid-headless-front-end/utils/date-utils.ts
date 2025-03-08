/**
 * Utility functions for date formatting and calculations
 */

/**
 * Format a date string into a human-readable relative time
 * @param dateString ISO date string to format
 * @returns Human-readable string describing how long ago the date was
 */
export function formatRelativeTime(dateString?: string | null): string {
	if (!dateString) return "Never";

	try {
		const date = new Date(dateString);
		if (Number.isNaN(date.getTime())) return "Invalid date";
		
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		// Less than 7 days
		if (diffDays < 7) {
			if (diffDays === 0) return "Today";
			if (diffDays === 1) return "Yesterday";
			return `${diffDays} days ago`;
		}

		// Less than 30 days
		if (diffDays < 30) {
			const weeks = Math.floor(diffDays / 7);
			return weeks === 1 ? "Last week" : `${weeks} weeks ago`;
		}

		// Less than 365 days
		if (diffDays < 365) {
			const months = Math.floor(diffDays / 30);
			return months === 1 ? "Last month" : `${months} months ago`;
		}

		// More than a year
		const years = Math.floor(diffDays / 365);
		return years === 1 ? "Last year" : `${years}+ years ago`;
	} catch (error) {
		return "Unknown";
	}
}
