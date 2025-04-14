import type {
	ApiResponse,
	Category,
	ProductStockResponse,
	Trip,
	TripParticipantsResponse,
	UserResponse,
	Variation,
} from "../types/api";
import { API_BASE_URL } from "./constants";

export const apiService = {
	async getUser(): Promise<ApiResponse<UserResponse>> {
		try {
			const response = await fetch(`${API_BASE_URL}/hybrid-headless/v1/user`, {
				credentials: "include",
				headers: { "Cache-Control": "no-store" },
			});
			if (!response.ok) throw new Error("Failed to fetch user data");
			const data = await response.json();
			return { data, success: true };
		} catch (error) {
			return {
				success: false,
				data: null,
				message:
					error instanceof Error ? error.message : "Failed to fetch user data",
			};
		}
	},
	async getProductStock(
		productId: number,
	): Promise<ApiResponse<ProductStockResponse>> {
		try {
			const response = await fetch(
				`${API_BASE_URL}/hybrid-headless/v1/products/${productId}/stock`,
			);
			if (!response.ok) throw new Error("Failed to fetch stock");
			const data = await response.json();
			return { data, success: true };
		} catch (error) {
			return {
				success: false,
				data: null,
				message:
					error instanceof Error ? error.message : "Failed to fetch stock",
			};
		}
	},
	async getProductVariations(productId: number): Promise<
		ApiResponse<{
			variations: Variation[];
			userStatus: { isLoggedIn: boolean; isMember: boolean };
		}>
	> {
		try {
			const response = await fetch(
				`${API_BASE_URL}/hybrid-headless/v1/products/${productId}/variations`,
			);
			if (!response.ok) throw new Error("Failed to fetch variations");
			const data = await response.json();
			return { data, success: true };
		} catch (error) {
			return {
				success: false,
				data: null,
				message:
					error instanceof Error ? error.message : "Failed to fetch variations",
			};
		}
	},

	async getStock(
		productId: number,
		variationId: number,
	): Promise<
		ApiResponse<{
			stock_quantity: number;
			stock_status: string;
		}>
	> {
		try {
			const response = await fetch(
				`${API_BASE_URL}/hybrid-headless/v1/stock/${productId}/${variationId}`,
			);
			if (!response.ok) throw new Error("Failed to fetch stock");
			const data = await response.json();
			return { data, success: true };
		} catch (error) {
			return {
				success: false,
				data: null,
				message:
					error instanceof Error ? error.message : "Failed to fetch stock",
			};
		}
	},

	async getTrips(useCache = true): Promise<ApiResponse<Trip[]>> {
		try {
			// Fetch regular trips (exclude reports by default)
			const cacheParam = useCache ? "cachemeifyoucan=please" : "nocache=please";
			// Ensure get_reports=false is implicitly handled by the backend or explicitly if needed
			const url = `${API_BASE_URL}/hybrid-headless/v1/products?${cacheParam}`;

			const response = await fetch(url);
			if (!response.ok) throw new Error("Failed to fetch trips");
			const data = await response.json();

			// Normalize variations
			const normalizedTrips = data.products.map((trip: Trip) => ({
				...trip,
				variations: (trip.variations || []).map((v) => ({
					...v,
					stock_quantity: v.stock_quantity ?? null,
					stock_status: v.stock_status || "instock",
				})),
			}));

			return {
				success: true,
				data: normalizedTrips,
				timestamp: Date.now(),
			};
		} catch (error) {
			return {
				success: false,
				data: null,
				message:
					error instanceof Error ? error.message : "Failed to fetch trips",
			};
		}
	},

	async getTripReports(useCache = true): Promise<ApiResponse<Trip[]>> {
		try {
			// Fetch only trip reports
			const cacheParam = useCache ? "cachemeifyoucan=please" : "nocache=please";
			const url = `${API_BASE_URL}/hybrid-headless/v1/products?get_reports=true&${cacheParam}`;

			const response = await fetch(url);
			if (!response.ok) throw new Error("Failed to fetch trip reports");
			const data = await response.json();

			// Normalize variations (though reports might not have them, good practice)
			const normalizedReports = data.products.map((trip: Trip) => ({
				...trip,
				variations: (trip.variations || []).map((v) => ({
					...v,
					stock_quantity: v.stock_quantity ?? null,
					stock_status: v.stock_status || "instock",
				})),
			}));

			return {
				success: true,
				data: normalizedReports,
				timestamp: Date.now(),
			};
		} catch (error) {
			return {
				success: false,
				data: null,
				message:
					error instanceof Error
						? error.message
						: "Failed to fetch trip reports",
			};
		}
	},

	async getTrip(slug: string, useCache = false): Promise<ApiResponse<Trip>> {
		try {
			// This endpoint fetches a single product, which might be a trip or a report
			const cacheParam = useCache ? "cachemeifyoucan=please" : "nocache=please";
			const url = `${API_BASE_URL}/hybrid-headless/v1/products/${slug}?by_slug=true&${cacheParam}`;

			console.log(`[apiService.getTrip] Fetching: ${url}`); // Added for debugging
			const response = await fetch(url);

			if (!response.ok) {
				// Log status for debugging
				console.error(
					`[apiService.getTrip] Failed to fetch trip ${slug}. Status: ${response.status}`,
				);
				throw new Error(
					`Failed to fetch trip ${slug}. Status: ${response.status}`,
				);
			}
			const data = await response.json();
			return {
				data: data || null,
				success: true,
			};
		} catch (error) {
			return {
				data: null,
				success: false,
				message:
					error instanceof Error ? error.message : "Failed to fetch trip",
			};
		}
	},

	async getTripParticipants(
		tripId: number,
	): Promise<ApiResponse<TripParticipantsResponse>> {
		try {
			const response = await fetch(
				`${API_BASE_URL}/hybrid-headless/v1/trip-participants/${tripId}`,
				{
					credentials: "include",
					headers: {
						"Cache-Control": "no-cache",
					},
				},
			);

			if (!response.ok) {
				throw new Error(`Failed to fetch trip participants for trip ${tripId}`);
			}

			const data = await response.json();
			return {
				data,
				success: true,
			};
		} catch (error) {
			return {
				data: null,
				success: false,
				message:
					error instanceof Error
						? error.message
						: "Failed to fetch trip participants",
			};
		}
	},

	async getCategories(): Promise<ApiResponse<Category[]>> {
		try {
			const response = await fetch(
				`${API_BASE_URL}/hybrid-headless/v1/categories`,
			);
			if (!response.ok) {
				throw new Error("Failed to fetch categories");
			}
			const data = await response.json();
			return { data: data.categories || [], success: true };
		} catch (error) {
			return {
				data: [],
				success: false,
				message:
					error instanceof Error ? error.message : "Failed to fetch categories",
			};
		}
	},

	async updateVolunteerRole(
		orderId: number,
		role: string,
	): Promise<
		ApiResponse<{
			success: boolean;
			order_id: number;
			role: string;
			status: string;
			assigned_by: {
				name: string;
				email: string;
			};
		}>
	> {
		try {
			const response = await fetch(
				`${API_BASE_URL}/hybrid-headless/v1/caving-crew/orders/${orderId}/volunteer`,
				{
					method: "PUT",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ role }),
				},
			);

			if (!response.ok) throw new Error("Failed to update volunteer role");
			const data = await response.json();
			return { data, success: true };
		} catch (error) {
			return {
				success: false,
				data: null,
				message:
					error instanceof Error ? error.message : "Failed to update role",
			};
		}
	},

	async getTripsByCategory(
		categorySlug: string,
		page = 1,
		perPage = 12,
	): Promise<ApiResponse<Trip[]>> {
		try {
			const response = await fetch(
				`${API_BASE_URL}/hybrid-headless/v1/products?category=${categorySlug}&page=${page}&per_page=${perPage}`,
			);
			if (!response.ok) {
				throw new Error(`Failed to fetch trips for category ${categorySlug}`);
			}
			const data = await response.json();
			return { data: data.products || [], success: true };
		} catch (error) {
			return {
				data: [],
				success: false,
				message:
					error instanceof Error
						? error.message
						: "Failed to fetch category trips",
			};
		}
	},

	async updateAttendanceStatus(
		orderId: number,
		status: string,
	): Promise<ApiResponse<{ success: boolean }>> {
		try {
			const response = await fetch(
				`${API_BASE_URL}/hybrid-headless/v1/caving-crew/orders/${orderId}/attendance`,
				{
					method: "PUT",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ status }),
				},
			);

			if (!response.ok) throw new Error("Failed to update attendance");
			return { data: await response.json(), success: true };
		} catch (error) {
			return {
				success: false,
				data: null,
				message: error instanceof Error ? error.message : "Update failed",
			};
		}
	},
};
