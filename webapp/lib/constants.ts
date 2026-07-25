// Appwrite Configuration
export const APPWRITE_ENDPOINT = process.env
  .NEXT_PUBLIC_APPWRITE_ENDPOINT as string;
export const APPWRITE_PROJECT_ID = process.env
  .NEXT_PUBLIC_APPWRITE_PROJECT_ID as string;

// Server-only API key (never expose to client)
export const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY as string;

// Database
export const DATABASE_ID = process.env
  .NEXT_PUBLIC_APPWRITE_DATABASE_ID as string;

// Collections
export const COLLECTIONS = {
  ORGANIZATIONS: "organizations",
  MENU_CATEGORIES: "menu_categories",
  MENU_ITEMS: "menu_items",
  ORDERS: "orders",
  ORDERS_SESSIONS: "orders_sessions",
  AVAILABILITY_SESSIONS: "availability_sessions",
} as const;

// Storage Buckets
export const BUCKETS = {
  MENU_IMAGES: "menu-images",
} as const;

// Auth Cookie
export const SESSION_COOKIE_NAME = `a_session_${APPWRITE_PROJECT_ID}`;

// Order Statuses
export const ORDER_STATUS = {
  IN_PROGRESS: "in_progress",
  PENDING: "pending",
  PREPARING: "preparing",
  READY: "ready",
  COMPLETED: "completed",
} as const;

// Order Types
export const ORDER_TYPE = {
  DINE_IN: "dine-in",
  TAKEAWAY: "takeaway",
} as const;

// Kitchen Board cleanup timer (ms)
export const KITCHEN_CLEANUP_TIMEOUT = 15 * 60 * 1000; // 15 minutes
