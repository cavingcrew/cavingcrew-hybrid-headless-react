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
					queryClient.setQueryData(tripKeys.all, (old: any) => ({
						...freshData,
						// Preserve timestamp if data is similar
						timestamp:
							old?.data &&
							freshData.data &&
							isDataStale(old.data, freshData.data)
								? Date.now()
								: old?.timestamp,
					}));
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
	const { data: tripsData } = useTrips();
	const queryClient = useQueryClient();

	return useQuery({
		queryKey: tripKeys.detail(slug),
		queryFn: async () => {
			// 1. Check main trips cache first
			const tripsData = queryClient.getQueryData<ApiResponse<Trip[]>>(
				tripKeys.all,
			);
			const cachedTrip = tripsData?.data?.find((t) => t.slug === slug);

			if (cachedTrip) {
				console.log("[useTrip] Using cached trip data for", slug);
				return { data: cachedTrip, success: true };
			}

			// 2. If not found, check if trips are still loading
			const isTripsLoading = queryClient.isFetching({ queryKey: tripKeys.all });
			if (isTripsLoading) {
				console.log("[useTrip] Waiting for trips load...");
				await queryClient.fetchQuery({
					queryKey: tripKeys.all,
					queryFn: () => apiService.getTrips(true),
				});
				return { data: undefined, success: true }; // Will retry after cache update
			}

			// 3. Final fallback to direct API call
			console.log("[useTrip] Fetching fresh data for", slug);
			return apiService.getTrip(slug);
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
	return oldData.some((trip, index) => trip.id !== newData[index]?.id);
}

export const useCategoryTrips = useTripsByCategory;
