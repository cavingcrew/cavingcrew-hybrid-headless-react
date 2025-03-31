'use client';

import { useUser } from "./useUser";
import type { Trip } from "../../types/api";

/**
 * Hook to check user access levels for a trip
 * @param trip The trip object to check access for
 * @returns Object with various access flags
 */
export function useTripAccess(trip: Trip) {
  const { purchasedProducts } = useUser();
  
  const hasPurchased = trip.id ? 
    purchasedProducts.includes(trip.id) ||
    trip.variations.some(v => purchasedProducts.includes(v.id)) : 
    false;

  return {
    hasPurchased,
    isParticipant: hasPurchased,
    canViewSensitiveInfo: hasPurchased
  };
}
