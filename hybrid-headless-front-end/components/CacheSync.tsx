"use client";

import { tripKeys } from "@/lib/hooks/useTrips";
import type { Trip } from "@/types/api";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function CacheSync({ trips }: { trips: Trip[] }) {
	const queryClient = useQueryClient();

	useEffect(() => {
		trips.forEach((trip) => {
			queryClient.setQueryData(tripKeys.detail(trip.slug), {
				data: trip,
				success: true,
				timestamp: Date.now(),
			});
		});
	}, [trips, queryClient]);

	return null;
}
