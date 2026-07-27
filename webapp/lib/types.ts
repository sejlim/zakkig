// ─── Appwrite Document Base ─────────────────────────────────────

export interface AppwriteDocument {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  $databaseId: string;
  $collectionId: string;
}

// ─── Organizations ──────────────────────────────────────────────

export interface Organization extends AppwriteDocument {
  name: string;
  address: string;
  logoFileId: string;
  ownerId: string;
  stripeAccountId: string;
  isToGoEnabled: boolean;
  isToStayEnabled: boolean;
  legalName: string;
  taxId: string;
  currency: string;
  deletionRequested: boolean;
  tables?: string[];
}

export interface CreateOrganizationData {
  name: string;
  address?: string;
  logoFileId?: string;
  ownerId: string;
  legalName?: string;
  taxId?: string;
  currency?: string;
  tables?: string[];
}

// ─── Menu Categories ────────────────────────────────────────────

export interface MenuCategory extends AppwriteDocument {
  organizationId: string;
  name: string;
  sortOrder: number;
}

export interface CreateMenuCategoryData {
  organizationId: string;
  name: string;
  sortOrder?: number;
  ownerId: string;
}

// ─── Menu Items ─────────────────────────────────────────────────

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

export interface MenuItem extends AppwriteDocument {
  organizationId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number; // in cents
  imageId: string;
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
  imageId?: string;
  available?: boolean;
  sortOrder?: number;
  ownerId: string;
  taxRate?: number;
  customizations?: string;
}

// ─── Orders ─────────────────────────────────────────────────────

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order extends AppwriteDocument {
  organizationId: string;
  tableNumber: string;
  type: "dine-in" | "takeaway";
  items: string; // JSON serialized OrderItem[]
  total: number; // in cents
  status: "in_progress" | "completed" | "cancelled";
  email: string;
  orderNumber: string;
  stripePaymentId: string;
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

// ─── Order Sessions ───────────────────────────────────────────

export interface OrderSession extends AppwriteDocument {
  organizationId: string;
  token: string;
  expiresAt: string | null;
}

// ─── Availability Sessions ────────────────────────────────────

export interface AvailabilitySession extends AppwriteDocument {
  organizationId: string;
  token: string;
  expiresAt: string | null;
}

// ─── Cart (Client State) ────────────────────────────────────────

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}
