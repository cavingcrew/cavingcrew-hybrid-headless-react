"use client";

import { apiService } from "@/lib/api-service";
import type { ApiResponse, CategoryResponse, Trip } from "@/types/api";
import {
	type UseQueryResult,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";

const membershipPlaceholder: Trip = {
	id: 1272,
	name: "Caving Crew Membership",
	slug: "caving-crew-membership",
	price: "30.00",
	description: "Become an official Caving Crew member",
	short_description: "Annual membership subscription",
	images: [],
	categories: [
		{ id: 999, name: "Memberships", slug: "memberships", description: "" },
	],
	has_purchased: false,
	can_purchase: true,
	variations: [],
	has_variations: false,
	is_variable: false,
	stock_status: "instock",
	stock_quantity: null,
	acf: {
		event_type: "membership",
		event_gear_required: "None",
		event_must_caved_with_us_before: "no",
		event_skills_required: "None required",
		event_trip_leader: "Automated",
		event_start_date_time: new Date().toISOString(),
		event_non_members_welcome: "no",
		event_members_discount: "0",
	},
};

export const tripKeys = {
	all: ["trips"] as const,
	detail: (slug: string) => [...tripKeys.all, "detail", slug] as const,
	category: (categorySlug: string) =>
		[...tripKeys.all, "category", categorySlug] as const,
	lists: () => [...tripKeys.all, "list"] as const,
};

export const tripReportKeys = {
	all: ["tripReports"] as const,
	lists: () => [...tripReportKeys.all, "list"] as const,
};

export function useTrips(): UseQueryResult<ApiResponse<Trip[]>> {
	const queryClient = useQueryClient();

	return useQuery<ApiResponse<Trip[]>>({
		queryKey: tripKeys.all,
		queryFn: async () => {
			// Initial empty state for instant render
			const initialEmptyState = {
				success: true,
				data: [],
				timestamp: Date.now(),
			};

			// Initial cached request
			const cachedResponse = await apiService.getTrips(true);

			// Queue background refresh
			queryClient.fetchQuery({
				queryKey: [...tripKeys.all, "fresh"],
				queryFn: async () => {
					const freshData = await apiService.getTrips(false);
					queryClient.setQueryData(
						tripKeys.all,
						(old: ApiResponse<Trip[]> | undefined) => ({
							...freshData,
							// Preserve timestamp if data is similar
							timestamp:
								old?.data &&
								freshData.data &&
								isDataStale(old.data, freshData.data)
									? Date.now()
									: old?.timestamp,
						}),
					);
					return freshData;
				},
				staleTime: 0,
			});

			// Return cached response or empty state
			return cachedResponse.success ? cachedResponse : initialEmptyState;
		},
		staleTime: 1000 * 30, // 30 seconds
		gcTime: 1000 * 60 * 10, // 10 minutes
		refetchOnWindowFocus: (query) => {
			const dataAge = Date.now() - (query.state.data?.timestamp || 0);
			return dataAge > 1000 * 30; // Only refetch if data older than 30s
		},
		refetchOnReconnect: true,
		refetchOnMount: true,
		placeholderData: {
			success: true,
			data: [membershipPlaceholder],
			timestamp: 0,
		}, // Instant initial render with membership
	});
}

export function useTrip(slug: string) {
	const queryClient = useQueryClient();

	// Function to find trip/report in caches
	const findInCaches = (): Trip | undefined => {
		const tripsCache = queryClient.getQueryData<ApiResponse<Trip[]>>(
			tripKeys.all,
		);
		const reportsCache = queryClient.getQueryData<ApiResponse<Trip[]>>(
			tripReportKeys.all,
		);
		return (
			tripsCache?.data?.find((t) => t.slug === slug) ||
			reportsCache?.data?.find((r) => r.slug === slug)
		);
	};

	return useQuery<ApiResponse<Trip>>({
		queryKey: tripKeys.detail(slug),
		queryFn: async () => {
			console.log("[useTrip] Fetching fresh data for", slug);
			// The query function now directly fetches the specific trip/report
			const response = await apiService.getTrip(slug);

			// If fetched successfully, update the detail cache
			if (response.success && response.data) {
				// Optional: Update the main list caches if needed, though maybe not necessary
				// queryClient.setQueryData(tripKeys.all, ...);
				// queryClient.setQueryData(tripReportKeys.all, ...);
			} else {
				console.error(`[useTrip] Failed to fetch ${slug}:`, response.message);
			}
			return response;
		},
		placeholderData: () => {
			// Try to find the data in either cache for an initial render
			const cachedData = findInCaches();
			if (cachedData) {
				console.log("[useTrip] Using placeholder data for", slug);
				return { data: cachedData, success: true, timestamp: Date.now() };
			}
			return undefined; // No placeholder if not found in caches
		},
		staleTime: 1000 * 60 * 5, // 5 minutes
		gcTime: 1000 * 60 * 60 * 24, // 24 hours
		refetchOnWindowFocus: false,
		enabled: !!slug,
	});
}

export function useTripsByCategory(categorySlug: string) {
	return useQuery<ApiResponse<CategoryResponse>>({
		queryKey: tripKeys.category(categorySlug),
		queryFn: async () => {
			try {
				const response = await apiService.getTripsByCategory(categorySlug);

				if (!response.success || !response.data) {
					return {
						success: false,
						data: null,
						message: response.message || "Failed to fetch category trips",
					};
				}

				const filteredData = response.data.map((trip) => ({
					...trip,
					categories: trip.categories || [],
				}));

				return {
					success: true,
					data: {
						products: filteredData,
						category: {
							name: categorySlug.replace(/-/g, " "),
							slug: categorySlug,
						},
					},
				};
			} catch (error) {
				return {
					success: false,
					data: null,
					message:
						error instanceof Error
							? error.message
							: "Failed to fetch category trips",
				};
			}
		},
		enabled: !!categorySlug,
		staleTime: 1000 * 60 * 5,
		gcTime: 1000 * 60 * 60,
	});
}

// Helper to check data freshness
function isDataStale(oldData: Trip[], newData: Trip[]): boolean {
	if (!oldData || !newData) return true;
	if (oldData.length !== newData.length) return true;
	// Basic check: compare IDs and maybe a key field like stock_status or name
	return oldData.some((trip, index) => {
		const newTrip = newData[index];
		if (!newTrip) return true; // Different length
		return trip.id !== newTrip.id || trip.stock_status !== newTrip.stock_status;
	});
}

export function useTripReports(): UseQueryResult<ApiResponse<Trip[]>> {
	const queryClient = useQueryClient();

	return useQuery<ApiResponse<Trip[]>>({
		queryKey: tripReportKeys.all,
		queryFn: async () => {
			// Initial empty state
			const initialEmptyState = {
				success: true,
				data: [],
				timestamp: Date.now(),
			};

			// Fetch cached reports
			const cachedResponse = await apiService.getTripReports(true);

			// Queue background refresh
			queryClient.fetchQuery({
				queryKey: [...tripReportKeys.all, "fresh"],
				queryFn: async () => {
					const freshData = await apiService.getTripReports(false);
					queryClient.setQueryData(
						tripReportKeys.all,
						(old: ApiResponse<Trip[]> | undefined) => ({
							...freshData,
							timestamp:
								old?.data &&
								freshData.data &&
								isDataStale(old.data, freshData.data)
									? Date.now()
									: old?.timestamp,
						}),
					);
					return freshData;
				},
				staleTime: 0,
			});

			return cachedResponse.success ? cachedResponse : initialEmptyState;
		},
		staleTime: 1000 * 60 * 5, // 5 minutes
		gcTime: 1000 * 60 * 15, // 15 minutes
		refetchOnWindowFocus: (query) => {
			const dataAge = Date.now() - (query.state.data?.timestamp || 0);
			return dataAge > 1000 * 60; // Refetch if older than 1 min
		},
		refetchOnReconnect: true,
		refetchOnMount: true,
		placeholderData: {
			success: true,
			data: [],
			timestamp: 0,
		},
	});
}

export const useCategoryTrips = useTripsByCategory;
