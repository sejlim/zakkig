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

export const KITCHEN_CLEANUP_MINUTES = 30;
export const KITCHEN_CLEANUP_TIMEOUT = KITCHEN_CLEANUP_MINUTES * 60 * 1000; // 30 minutes

// File Upload Limits
export const MAX_IMAGE_SIZE_MB = 10;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024; // 10 MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"] as const;
export const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"] as const;

export function isAllowedImageFile(file: File): boolean {
  if (file.type && (file.type === "image/jpeg" || file.type === "image/png")) {
    return true;
  }
  const name = (file.name || "").toLowerCase();
  return ALLOWED_IMAGE_EXTENSIONS.some((ext) => name.endsWith(ext));
}

