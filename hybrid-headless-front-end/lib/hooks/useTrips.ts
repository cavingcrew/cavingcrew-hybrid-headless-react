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
				queryKey: [...tripKeys.all, "fresh"], // Use a distinct key for the background fetch
				queryFn: async () => {
					console.log("[useTrips] Background fetching fresh trips list...");
					const freshResponse = await apiService.getTrips(false); // Fetch non-cached list
					if (freshResponse.success && freshResponse.data) {
						// Update the main list cache
						queryClient.setQueryData(
							tripKeys.all,
							(old: ApiResponse<Trip[]> | undefined) => ({
								...freshResponse,
								// Preserve timestamp if data is similar
								timestamp:
									old?.data &&
									freshResponse.data &&
									isDataStale(old.data, freshResponse.data)
										? Date.now()
										: old?.timestamp,
							}),
						);
						// --- Populate detail cache for each trip ---
						for (const trip of freshResponse.data) {
							queryClient.setQueryData(
								tripKeys.detail(trip.slug),
								{ data: trip, success: true, timestamp: Date.now() }, // Set detail data
							);
						}
						console.log(
							`[useTrips] Background fetch complete. Updated list and ${freshResponse.data.length} detail caches.`,
						);
					} else {
						console.error(
							"[useTrips] Background fetch failed:",
							freshResponse.message,
						);
					}
					return freshResponse;
				},
				staleTime: 0, // Ensure this fetch always runs if triggered
			});

			// --- Populate detail cache from the initial cached response ---
			if (cachedResponse.success && cachedResponse.data) {
				for (const trip of cachedResponse.data) {
					// Only set if not already present or older, avoid overwriting fresh data
					const existingDetail = queryClient.getQueryData<ApiResponse<Trip>>(
						tripKeys.detail(trip.slug),
					);
					if (
						!existingDetail ||
						(existingDetail.timestamp &&
							existingDetail.timestamp < (cachedResponse.timestamp ?? 0))
					) {
						queryClient.setQueryData(tripKeys.detail(trip.slug), {
							data: trip,
							success: true,
							timestamp: cachedResponse.timestamp,
						});
					}
				}
			}
			// --- End detail cache population ---

			// Return cached response or empty state
			return cachedResponse.success ? cachedResponse : initialEmptyState;
		},
		// Removed duplicated block here
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
				queryKey: [...tripReportKeys.all, "fresh"], // Use a distinct key
				queryFn: async () => {
					console.log(
						"[useTripReports] Background fetching fresh reports list...",
					);
					const freshResponse = await apiService.getTripReports(false); // Fetch non-cached
					if (freshResponse.success && freshResponse.data) {
						// Update the main list cache
						queryClient.setQueryData(
							tripReportKeys.all,
							(old: ApiResponse<Trip[]> | undefined) => ({
								...freshResponse,
								timestamp:
									old?.data &&
									freshResponse.data &&
									isDataStale(old.data, freshResponse.data)
										? Date.now()
										: (old?.timestamp ?? Date.now()), // Ensure timestamp exists
							}),
						);
						// --- Populate detail cache for each report ---
						for (const report of freshResponse.data) {
							queryClient.setQueryData(
								tripKeys.detail(report.slug), // Use tripKeys.detail for consistency
								{ data: report, success: true, timestamp: Date.now() }, // Set detail data
							);
						}
						console.log(
							`[useTripReports] Background fetch complete. Updated list and ${freshResponse.data.length} detail caches.`,
						);
					} else {
						console.error(
							"[useTripReports] Background fetch failed:",
							freshResponse.message,
						);
					}
					return freshResponse;
				},
				staleTime: 0, // Ensure this fetch always runs if triggered
			});

			// --- Populate detail cache from the initial cached response ---
			if (cachedResponse.success && cachedResponse.data) {
				for (const report of cachedResponse.data) {
					const existingDetail = queryClient.getQueryData<ApiResponse<Trip>>(
						tripKeys.detail(report.slug),
					);
					if (
						!existingDetail ||
						(existingDetail.timestamp &&
							existingDetail.timestamp < (cachedResponse.timestamp ?? 0))
					) {
						queryClient.setQueryData(
							tripKeys.detail(report.slug),
							{
								data: report,
								success: true,
								timestamp: cachedResponse.timestamp ?? Date.now(),
							}, // Ensure timestamp exists
						);
					}
				}
			}
			// --- End detail cache population ---

			return cachedResponse.success ? cachedResponse : initialEmptyState;
		}, // This closing brace '}' correctly ends the queryFn

		// These options should be part of the main useQuery options object
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
