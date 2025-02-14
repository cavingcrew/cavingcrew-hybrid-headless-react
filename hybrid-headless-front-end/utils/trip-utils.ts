import type { Trip } from '@/types/api';

export function getTripAvailability(trip: Trip) {
  const now = new Date();
  
  // Check if signup is in the future
  if (trip.acf.event_signup_opens) {
    const signupOpensDate = new Date(trip.acf.event_signup_opens);
    if (!isNaN(signupOpensDate.getTime()) && signupOpensDate > now) {
      return {
        isAvailable: false,
        statusMessage: `Opens ${signupOpensDate.toLocaleDateString('en-GB', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric' 
        })}`,
        badgeColor: 'blue' as const
      };
    }
  }

  // Check stock availability
  let isAvailable = false;
  if (trip.has_variations) {
    isAvailable = trip.variations.some(v => (v.stock_quantity ?? 0) > 0);
  } else {
    isAvailable = (trip.stock_quantity ?? 0) > 0;
  }

  return {
    isAvailable,
    statusMessage: isAvailable ? 'Available' : 'Full',
    badgeColor: isAvailable ? 'green' : 'red' as const
  };
}
