'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { tripKeys } from '@/lib/hooks/useTrips'
import type { Trip } from '@/types/api'

export function CacheSync({ trips }: { trips: Trip[] }) {
  const queryClient = useQueryClient()

  useEffect(() => {
    trips.forEach(trip => {
      queryClient.setQueryData(tripKeys.detail(trip.slug), {
        data: trip,
        success: true,
        timestamp: Date.now()
      })
    })
  }, [trips, queryClient])

  return null
}
