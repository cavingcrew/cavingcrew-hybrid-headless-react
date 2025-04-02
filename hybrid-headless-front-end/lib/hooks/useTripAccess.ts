'use client';

import { useUser } from "@/lib/hooks/useUser";
import { useTripParticipants } from "@/lib/hooks/useTripParticipants";
import { Auth } from "@/utils/user-utils";
import type { Trip } from "@/types/api";

/**
 * Hook to check user access levels for a trip
 * @param trip The trip object to check access for
 * @returns Object with various access flags
 */
export function useTripAccess(trip: Trip) {
  const { user, purchasedProducts } = useUser();
  const { data } = useTripParticipants(trip?.id);
  const accessLevel = data?.data?.access_level;
  
  const hasPurchased = trip.id ? 
    purchasedProducts?.includes(trip.id) ||
    trip.variations.some(v => purchasedProducts?.includes(v.id)) : 
    false;

  return {
    hasPurchased,
    isParticipant: hasPurchased,
    canViewSensitiveInfo: Auth.canViewSensitive(user, trip, accessLevel),
    isTripLeader: Auth.isTripLeader(user, trip),
    canEdit: Auth.canEditTrip(user, trip, accessLevel)
  };
}
