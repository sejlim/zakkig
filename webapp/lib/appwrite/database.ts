import 'server-only'

import { ID, Query, Permission, Role } from 'node-appwrite'
import { createAdminClient, createSessionClient } from './server'
import { DATABASE_ID, COLLECTIONS } from '@/lib/constants'
import type {
  Organization,
  MenuCategory,
  MenuItem,
  Order,
  KitchenSession,
  CreateOrganizationData,
  CreateMenuCategoryData,
  CreateMenuItemData,
  CreateOrderData,
} from '@/lib/types'

// ─── Organizations ──────────────────────────────────────────────

export async function getOrganizationByOwner(ownerId: string): Promise<Organization | null> {
  const { tablesDB } = createAdminClient()

  const result = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: COLLECTIONS.ORGANIZATIONS,
    queries: [Query.equal('ownerId', ownerId), Query.limit(1)],
  })

  return (result.rows[0] as unknown as Organization) ?? null
}

export async function getOrganization(id: string): Promise<Organization | null> {
  const { tablesDB } = createAdminClient()

  try {
    const row = await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: COLLECTIONS.ORGANIZATIONS,
      rowId: id,
    })
    return row as unknown as Organization
  } catch {
    return null
  }
}

export async function createOrganization(data: CreateOrganizationData): Promise<Organization> {
  const { tablesDB } = createAdminClient()

  const row = await tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: COLLECTIONS.ORGANIZATIONS,
    rowId: ID.unique(),
    data: {
      name: data.name,
      address: data.address ?? '',
      logoFileId: data.logoFileId ?? '',
      ownerId: data.ownerId,
      stripeAccountId: '',
    },
    permissions: [
      Permission.read(Role.user(data.ownerId)),
      Permission.update(Role.user(data.ownerId)),
      Permission.delete(Role.user(data.ownerId)),
    ],
  })

  return row as unknown as Organization
}

export async function updateOrganization(id: string, data: Partial<import('../types').Organization>) {
  const { tablesDB } = createAdminClient()

  return tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: COLLECTIONS.ORGANIZATIONS,
    rowId: id,
    data,
  })
}

// ─── Menu Categories ────────────────────────────────────────────

export async function getMenuCategories(organizationId: string): Promise<MenuCategory[]> {
  const { tablesDB } = createAdminClient()

  const result = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: COLLECTIONS.MENU_CATEGORIES,
    queries: [
      Query.equal('organizationId', organizationId),
      Query.orderAsc('sortOrder'),
      Query.limit(100),
    ],
  })

  return result.rows as unknown as MenuCategory[]
}

export async function createMenuCategory(data: CreateMenuCategoryData): Promise<MenuCategory> {
  const { tablesDB } = createAdminClient()

  const row = await tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: COLLECTIONS.MENU_CATEGORIES,
    rowId: ID.unique(),
    data: {
      organizationId: data.organizationId,
      name: data.name,
      sortOrder: data.sortOrder ?? 0,
    },
    permissions: [
      Permission.read(Role.any()),
      Permission.update(Role.user(data.ownerId)),
      Permission.delete(Role.user(data.ownerId)),
    ],
  })

  return row as unknown as MenuCategory
}

export async function updateMenuCategory(id: string, data: { name?: string; sortOrder?: number }) {
  const sessionClient = await createSessionClient()
  if (!sessionClient) throw new Error('Not authenticated')

  return sessionClient.tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: COLLECTIONS.MENU_CATEGORIES,
    rowId: id,
    data,
  })
}

export async function deleteMenuCategory(id: string) {
  const sessionClient = await createSessionClient()
  if (!sessionClient) throw new Error('Not authenticated')

  return sessionClient.tablesDB.deleteRow({
    databaseId: DATABASE_ID,
    tableId: COLLECTIONS.MENU_CATEGORIES,
    rowId: id,
  })
}

// ─── Menu Items ─────────────────────────────────────────────────

export async function getMenuItems(organizationId: string): Promise<MenuItem[]> {
  const { tablesDB } = createAdminClient()

  const result = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: COLLECTIONS.MENU_ITEMS,
    queries: [
      Query.equal('organizationId', organizationId),
      Query.orderAsc('sortOrder'),
      Query.limit(100),
    ],
  })

  return result.rows as unknown as MenuItem[]
}

export async function getAvailableMenuItems(organizationId: string): Promise<MenuItem[]> {
  const { tablesDB } = createAdminClient()

  const result = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: COLLECTIONS.MENU_ITEMS,
    queries: [
      Query.equal('organizationId', organizationId),
      Query.equal('available', true),
      Query.orderAsc('sortOrder'),
      Query.limit(100),
    ],
  })

  return result.rows as unknown as MenuItem[]
}

export async function createMenuItem(data: CreateMenuItemData): Promise<MenuItem> {
  const { tablesDB } = createAdminClient()

  const row = await tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: COLLECTIONS.MENU_ITEMS,
    rowId: ID.unique(),
    data: {
      organizationId: data.organizationId,
      categoryId: data.categoryId,
      name: data.name,
      description: data.description ?? '',
      price: data.price,
      imageId: data.imageId ?? '',
      available: data.available ?? true,
      sortOrder: data.sortOrder ?? 0,
    },
    permissions: [
      Permission.read(Role.any()),
      Permission.update(Role.user(data.ownerId)),
      Permission.delete(Role.user(data.ownerId)),
    ],
  })

  return row as unknown as MenuItem
}

export async function updateMenuItem(id: string, data: Partial<CreateMenuItemData>) {
  const sessionClient = await createSessionClient()
  if (!sessionClient) throw new Error('Not authenticated')

  return sessionClient.tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: COLLECTIONS.MENU_ITEMS,
    rowId: id,
    data,
  })
}

export async function deleteMenuItem(id: string) {
  const sessionClient = await createSessionClient()
  if (!sessionClient) throw new Error('Not authenticated')

  return sessionClient.tablesDB.deleteRow({
    databaseId: DATABASE_ID,
    tableId: COLLECTIONS.MENU_ITEMS,
    rowId: id,
  })
}

// ─── Orders ─────────────────────────────────────────────────────

export async function getOrders(organizationId: string, status?: string): Promise<Order[]> {
  const { tablesDB } = createAdminClient()

  const queries = [
    Query.equal('organizationId', organizationId),
    Query.orderDesc('$createdAt'),
    Query.limit(100),
  ]

  if (status) {
    queries.push(Query.equal('status', status))
  }

  const result = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: COLLECTIONS.ORDERS,
    queries,
  })

  return result.rows as unknown as Order[]
}

export async function getOrder(id: string): Promise<Order | null> {
  const { tablesDB } = createAdminClient()

  try {
    const row = await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: COLLECTIONS.ORDERS,
      rowId: id,
    })
    return row as unknown as Order
  } catch {
    return null
  }
}

export async function createOrder(data: CreateOrderData): Promise<Order> {
  const { tablesDB } = createAdminClient()

  const orderNumber = `Z-${Date.now().toString(36).toUpperCase()}`

  const row = await tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: COLLECTIONS.ORDERS,
    rowId: ID.unique(),
    data: {
      organizationId: data.organizationId,
      tableNumber: data.tableNumber ?? '',
      type: data.type,
      items: JSON.stringify(data.items),
      total: data.total,
      status: 'pending',
      email: data.email,
      orderNumber,
      stripePaymentId: data.stripePaymentId ?? '',
    },
    permissions: [
      Permission.read(Role.any()),
      Permission.update(Role.any()),
    ],
  })

  return row as unknown as Order
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { tablesDB } = createAdminClient()

  return tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: COLLECTIONS.ORDERS,
    rowId: orderId,
    data: { status },
  })
}

// ─── Kitchen Sessions ───────────────────────────────────────────

export async function getKitchenSessions(organizationId: string): Promise<KitchenSession[]> {
  const { tablesDB } = createAdminClient()

  const result = await tablesDB.listRows({
    databaseId: DATABASE_ID,
    tableId: COLLECTIONS.KITCHEN_SESSIONS,
    queries: [
      Query.equal('organizationId', organizationId),
      Query.orderDesc('$createdAt'),
      Query.limit(10),
    ],
  })

  return result.rows as unknown as KitchenSession[]
}

export async function createKitchenSession(organizationId: string, ownerId: string): Promise<KitchenSession> {
  const { tablesDB } = createAdminClient()

  const token = crypto.randomUUID()

  const row = await tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: COLLECTIONS.KITCHEN_SESSIONS,
    rowId: ID.unique(),
    data: {
      organizationId,
      token,
      expiresAt: null,
    },
    permissions: [
      Permission.read(Role.user(ownerId)),
      Permission.update(Role.user(ownerId)),
      Permission.delete(Role.user(ownerId)),
    ],
  })

  return row as unknown as KitchenSession
}

export async function deleteKitchenSession(id: string) {
  const sessionClient = await createSessionClient()
  if (!sessionClient) throw new Error('Not authenticated')

  return sessionClient.tablesDB.deleteRow({
    databaseId: DATABASE_ID,
    tableId: COLLECTIONS.KITCHEN_SESSIONS,
    rowId: id,
  })
}
