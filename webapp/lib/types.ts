// Convex Document Base

export interface ConvexDocument {
  _id: string;
  _creationTime: number;
  /** Compatibility alias for _id */
  $id: string;
  /** Compatibility alias for _creationTime ISO string */
  $createdAt?: string;
  $updatedAt?: string;
  $permissions?: string[];
  $databaseId?: string;
  $collectionId?: string;
}

// Organizations

export interface Organization extends ConvexDocument {
  name: string;
  address?: string;
  logoStorageId?: string;
  logoFileId?: string; // compatibility
  logoUrl?: string | null;
  bannerStorageId?: string;
  bannerFileId?: string; // compatibility
  bannerUrl?: string | null;
  ownerId: string;
  stripeAccountId?: string;
  stripeOnboardingComplete?: boolean;
  isToGoEnabled?: boolean;
  isToStayEnabled?: boolean;
  legalName?: string;
  taxId?: string;
  currency?: string;
  deletionRequested?: boolean;
  tables?: string[];
}

export interface CreateOrganizationData {
  name: string;
  address?: string;
  logoStorageId?: string;
  logoFileId?: string;
  bannerStorageId?: string;
  bannerFileId?: string;
  ownerId: string;
  legalName?: string;
  taxId?: string;
  currency?: string;
  tables?: string[];
}

// Menu Categories

export interface MenuCategory extends ConvexDocument {
  organizationId: string;
  name: string;
  sortOrder: number;
}

export interface CreateMenuCategoryData {
  organizationId: string;
  name: string;
  sortOrder?: number;
  ownerId?: string;
}

// Menu Items

export interface CustomizationOption {
  id: string;
  name: string;
  nameEn?: string;
  extraPrice: number; // in cents, 0 if included
  available: boolean;
  sortOrder: number;
}

export interface CustomizationStep {
  id: string;
  name: string;
  nameEn?: string;
  minSelections: number;
  maxSelections: number;
  includedCount: number; // how many selections are free
  available?: boolean;
  sortOrder: number;
  options: CustomizationOption[];
}

export interface MenuItem extends ConvexDocument {
  organizationId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number; // in cents
  imageStorageId?: string;
  imageId?: string; // compatibility
  imageUrl?: string | null;
  available: boolean;
  sortOrder: number;
  taxRate: number;
  customizations: string; // JSON serialized CustomizationStep[]
}

export interface CreateMenuItemData {
  organizationId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageStorageId?: string;
  imageId?: string;
  available?: boolean;
  sortOrder?: number;
  ownerId?: string;
  taxRate?: number;
  customizations?: string;
}

// Orders

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order extends ConvexDocument {
  organizationId: string;
  tableNumber?: string;
  type: "dine-in" | "takeaway";
  items: string; // JSON serialized OrderItem[]
  total: number; // in cents
  status: "in_progress" | "completed" | "cancelled";
  completedAt?: number;
  email: string;
  orderNumber: string;
  stripePaymentId?: string;
  zakkigFee: number; // in cents
  stripeFee: number; // in cents
  netAmount: number; // in cents
  currency: string;
}

export interface CreateOrderData {
  organizationId: string;
  tableNumber?: string;
  type: "dine-in" | "takeaway";
  items: OrderItem[];
  total: number;
  email: string;
  stripePaymentId?: string;
  zakkigFee: number;
  stripeFee: number;
  netAmount: number;
  currency?: string;
}

// Order Sessions

export interface OrderSession extends ConvexDocument {
  organizationId: string;
  token: string;
  expiresAt?: string | null;
}

// Availability Sessions

export interface AvailabilitySession extends ConvexDocument {
  organizationId: string;
  token: string;
  expiresAt?: string | null;
}

// Cart (Client State)

export interface CartItem {
  id: string; // Unique ID for this specific configured item
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  customizations?: {
    stepName: string;
    optionName: string;
    extraPrice: number;
  }[];
}
