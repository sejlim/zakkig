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

// Kitchen Board cleanup timer (ms)
export const KITCHEN_CLEANUP_TIMEOUT = 15 * 60 * 1000; // 15 minutes
