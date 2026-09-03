// Convex Configuration
export const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL as string;

// Auth Cookie
export const SESSION_COOKIE_NAME = "zakkig_session";

// Order Statuses
export const ORDER_STATUS = {
  IN_PROGRESS: "in_progress",
  PENDING: "pending",
  PREPARING: "preparing",
  READY: "ready",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

// Order Types
export const ORDER_TYPE = {
  DINE_IN: "dine-in",
  TAKEAWAY: "takeaway",
} as const;

// Expiration & Cleanup Timeouts (ms)
export const AUTH_TOKEN_EXPIRY_MINUTES = 30;
export const AUTH_TOKEN_EXPIRY_MS = AUTH_TOKEN_EXPIRY_MINUTES * 60 * 1000; // 30 minutes

export const TRACKING_EXPIRY_MINUTES = 10;
export const TRACKING_EXPIRY_MS = TRACKING_EXPIRY_MINUTES * 60 * 1000; // 10 minutes

export const KITCHEN_CLEANUP_MINUTES = 15;
export const KITCHEN_CLEANUP_TIMEOUT = KITCHEN_CLEANUP_MINUTES * 60 * 1000; // 15 minutes

