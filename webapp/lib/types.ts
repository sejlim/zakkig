// ─── Appwrite Document Base ─────────────────────────────────────

export interface AppwriteDocument {
  $id: string
  $createdAt: string
  $updatedAt: string
  $permissions: string[]
  $databaseId: string
  $collectionId: string
}

// ─── Organizations ──────────────────────────────────────────────

export interface Organization extends AppwriteDocument {
  name: string
  address: string
  logoFileId: string
  ownerId: string
  stripeAccountId: string
  isToGoEnabled: boolean
  isToStayEnabled: boolean
}

export interface CreateOrganizationData {
  name: string
  address?: string
  logoFileId?: string
  ownerId: string
}

// ─── Menu Categories ────────────────────────────────────────────

export interface MenuCategory extends AppwriteDocument {
  organizationId: string
  name: string
  sortOrder: number
}

export interface CreateMenuCategoryData {
  organizationId: string
  name: string
  sortOrder?: number
  ownerId: string
}

// ─── Menu Items ─────────────────────────────────────────────────

export interface MenuItem extends AppwriteDocument {
  organizationId: string
  categoryId: string
  name: string
  description: string
  price: number // in cents
  imageId: string
  available: boolean
  sortOrder: number
}

export interface CreateMenuItemData {
  organizationId: string
  categoryId: string
  name: string
  description?: string
  price: number
  imageId?: string
  available?: boolean
  sortOrder?: number
  ownerId: string
}

// ─── Orders ─────────────────────────────────────────────────────

export interface OrderItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
}

export interface Order extends AppwriteDocument {
  organizationId: string
  tableNumber: string
  type: 'dine-in' | 'takeaway'
  items: string // JSON serialized OrderItem[]
  total: number // in cents
  status: 'pending' | 'preparing' | 'ready' | 'completed'
  email: string
  orderNumber: string
  stripePaymentId: string
}

export interface CreateOrderData {
  organizationId: string
  tableNumber?: string
  type: 'dine-in' | 'takeaway'
  items: OrderItem[]
  total: number
  email: string
  stripePaymentId?: string
}

// ─── Kitchen Sessions ───────────────────────────────────────────

export interface KitchenSession extends AppwriteDocument {
  organizationId: string
  token: string
  expiresAt: string | null
}

// ─── Cart (Client State) ────────────────────────────────────────

export interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
}
