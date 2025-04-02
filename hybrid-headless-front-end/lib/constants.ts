const DEFAULT_API_URL = "https://www.cavingcrew.com/wp-json";

export const API_BASE_URL =
	(typeof window !== "undefined" &&
		window.__NEXT_DATA__?.env?.NEXT_PUBLIC_WORDPRESS_API_URL) ||
	(typeof window !== "undefined"
		? window.location.origin + "/wp-json"
		: DEFAULT_API_URL);

if (
	!API_BASE_URL &&
	typeof window !== "undefined" &&
	window.location.hostname !== "localhost"
) {
	console.error("NEXT_PUBLIC_WORDPRESS_API_URL is required in production");
}

// Add global type definition for window
declare global {
	interface Window {
		__NEXT_DATA__?: {
			env?: {
				NEXT_PUBLIC_WORDPRESS_API_URL?: string;
			};
		};
	}
}
