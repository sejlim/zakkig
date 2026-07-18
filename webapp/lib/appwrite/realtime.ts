'use client'

import { Channel, type RealtimeResponseEvent } from 'appwrite'
import { realtime } from './client'
import { DATABASE_ID, COLLECTIONS } from '@/lib/constants'

/**
 * Subscribe to real-time order changes for a specific organization.
 * Returns an unsubscribe function.
 */
export function subscribeToOrders(
  organizationId: string,
  callback: (event: RealtimeResponseEvent<Record<string, unknown>>) => void,
) {
  const channel = Channel.tablesdb(DATABASE_ID)
    .table(COLLECTIONS.ORDERS)
    .row()

  const subscription = realtime.subscribe(channel, (response) => {
    const payload = response.payload as Record<string, unknown>
    if (payload.organizationId === organizationId) {
      callback(response)
    }
  })

  return subscription
}

/**
 * Subscribe to a specific order's status changes.
 */
export function subscribeToOrder(
  orderId: string,
  callback: (event: RealtimeResponseEvent<Record<string, unknown>>) => void,
) {
  const channel = Channel.tablesdb(DATABASE_ID)
    .table(COLLECTIONS.ORDERS)
    .row(orderId)

  return realtime.subscribe(channel, callback)
}
