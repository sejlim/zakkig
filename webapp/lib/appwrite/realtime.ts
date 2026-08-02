"use client";

import { type RealtimeResponseEvent } from "appwrite";
import { client } from "./client";
import { DATABASE_ID, COLLECTIONS } from "@/lib/constants";

/**
 * Subscribe to real-time order changes for a specific organization.
 * Returns an unsubscribe function.
 */
export function subscribeToOrders(
  organizationId: string,
  callback: (event: RealtimeResponseEvent<Record<string, unknown>>) => void,
) {
  const channel = `databases.${DATABASE_ID}.collections.${COLLECTIONS.ORDERS}.documents`;

  const subscription = client.subscribe(channel, (response: any) => {
    const payload = response.payload as Record<string, unknown>;
    if (payload.organizationId === organizationId) {
      callback(response as RealtimeResponseEvent<Record<string, unknown>>);
    }
  });

  return subscription;
}

/**
 * Subscribe to a specific order's status changes.
 */
export function subscribeToOrder(
  orderId: string,
  callback: (event: RealtimeResponseEvent<Record<string, unknown>>) => void,
) {
  const channel = `databases.${DATABASE_ID}.collections.${COLLECTIONS.ORDERS}.documents.${orderId}`;

  return client.subscribe(
    channel,
    callback as (event: RealtimeResponseEvent<unknown>) => void,
  );
}

/**
 * Subscribe to a specific organization's changes (e.g. deletion).
 */
export function subscribeToOrganization(
  organizationId: string,
  callback: (event: RealtimeResponseEvent<Record<string, unknown>>) => void,
) {
  const channel = `databases.${DATABASE_ID}.collections.${COLLECTIONS.ORGANIZATIONS}.documents.${organizationId}`;

  return client.subscribe(
    channel,
    callback as (event: RealtimeResponseEvent<unknown>) => void,
  );
}
