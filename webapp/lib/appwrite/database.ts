import "server-only";

import { ID, Query, Permission, Role } from "node-appwrite";
import { createAdminClient } from "./server";
import { DATABASE_ID, COLLECTIONS } from "@/lib/constants";
import type {
  Organization,
  MenuCategory,
  MenuItem,
  Order,
  OrderSession,
  AvailabilitySession,
  CreateOrganizationData,
  CreateMenuCategoryData,
  CreateMenuItemData,
  CreateOrderData,
} from "@/lib/types";

// ─── Organizations ──────────────────────────────────────────────

export async function getOrganizationByOwner(
  ownerId: string,
): Promise<Organization | null> {
  const { tablesDB } = createAdminClient();

  const result = await tablesDB.listDocuments(
    DATABASE_ID,
    COLLECTIONS.ORGANIZATIONS,
    [Query.equal("ownerId", ownerId), Query.limit(1)],
  );

  return (result.documents[0] as unknown as Organization) ?? null;
}

export async function getOrganization(
  id: string,
): Promise<Organization | null> {
  const { tablesDB } = createAdminClient();

  try {
    const doc = await tablesDB.getDocument(
      DATABASE_ID,
      COLLECTIONS.ORGANIZATIONS,
      id,
    );
    return doc as unknown as Organization;
  } catch {
    return null;
  }
}

export async function createOrganization(
  data: CreateOrganizationData,
): Promise<Organization> {
  const { tablesDB } = createAdminClient();

  const doc = await tablesDB.createDocument(
    DATABASE_ID,
    COLLECTIONS.ORGANIZATIONS,
    ID.unique(),
    {
      name: data.name,
      address: data.address ?? "",
      logoFileId: data.logoFileId ?? "",
      ownerId: data.ownerId,
      stripeAccountId: "",
      isToGoEnabled: false,
      isToStayEnabled: false,
      legalName: data.legalName ?? "",
      taxId: data.taxId ?? "",
      currency: data.currency ?? "EUR",
      deletionRequested: false,
    },
    [
      Permission.read(Role.user(data.ownerId)),
      Permission.update(Role.user(data.ownerId)),
      Permission.delete(Role.user(data.ownerId)),
    ],
  );

  return doc as unknown as Organization;
}

export async function updateOrganization(
  id: string,
  data: Partial<Organization>,
) {
  const { tablesDB } = createAdminClient();

  return tablesDB.updateDocument(
    DATABASE_ID,
    COLLECTIONS.ORGANIZATIONS,
    id,
    data,
  );
}

// ─── Menu Categories ────────────────────────────────────────────

export async function getMenuCategories(
  organizationId: string,
): Promise<MenuCategory[]> {
  const { tablesDB } = createAdminClient();

  const result = await tablesDB.listDocuments(
    DATABASE_ID,
    COLLECTIONS.MENU_CATEGORIES,
    [
      Query.equal("organizationId", organizationId),
      Query.orderAsc("sortOrder"),
      Query.limit(100),
    ],
  );

  return result.documents as unknown as MenuCategory[];
}

export async function createMenuCategory(
  data: CreateMenuCategoryData,
): Promise<MenuCategory> {
  const { tablesDB } = createAdminClient();

  const doc = await tablesDB.createDocument(
    DATABASE_ID,
    COLLECTIONS.MENU_CATEGORIES,
    ID.unique(),
    {
      organizationId: data.organizationId,
      name: data.name,
      sortOrder: data.sortOrder ?? 0,
    },
    [
      Permission.read(Role.any()),
      Permission.update(Role.user(data.ownerId)),
      Permission.delete(Role.user(data.ownerId)),
    ],
  );

  return doc as unknown as MenuCategory;
}

export async function updateMenuCategory(
  id: string,
  data: { name?: string; sortOrder?: number },
) {
  const { tablesDB } = createAdminClient();
  return tablesDB.updateDocument(
    DATABASE_ID,
    COLLECTIONS.MENU_CATEGORIES,
    id,
    data,
  );
}

export async function deleteMenuCategory(id: string) {
  const { tablesDB } = createAdminClient();
  return tablesDB.deleteDocument(
    DATABASE_ID,
    COLLECTIONS.MENU_CATEGORIES,
    id,
  );
}

// ─── Menu Items ─────────────────────────────────────────────────

export async function getMenuItems(
  organizationId: string,
): Promise<MenuItem[]> {
  const { tablesDB } = createAdminClient();

  const result = await tablesDB.listDocuments(
    DATABASE_ID,
    COLLECTIONS.MENU_ITEMS,
    [
      Query.equal("organizationId", organizationId),
      Query.orderAsc("sortOrder"),
      Query.limit(100),
    ],
  );

  return result.documents as unknown as MenuItem[];
}

export async function getMenuItem(id: string): Promise<MenuItem | null> {
  const { tablesDB } = createAdminClient();
  try {
    const doc = await tablesDB.getDocument(
      DATABASE_ID,
      COLLECTIONS.MENU_ITEMS,
      id,
    );
    return doc as unknown as MenuItem;
  } catch {
    return null;
  }
}

export async function getAvailableMenuItems(
  organizationId: string,
): Promise<MenuItem[]> {
  const { tablesDB } = createAdminClient();

  const result = await tablesDB.listDocuments(
    DATABASE_ID,
    COLLECTIONS.MENU_ITEMS,
    [
      Query.equal("organizationId", organizationId),
      Query.equal("available", true),
      Query.orderAsc("sortOrder"),
      Query.limit(100),
    ],
  );

  return result.documents as unknown as MenuItem[];
}

export async function createMenuItem(
  data: CreateMenuItemData,
): Promise<MenuItem> {
  const { tablesDB } = createAdminClient();

  const doc = await tablesDB.createDocument(
    DATABASE_ID,
    COLLECTIONS.MENU_ITEMS,
    ID.unique(),
    {
      organizationId: data.organizationId,
      categoryId: data.categoryId,
      name: data.name,
      description: data.description ?? "",
      price: data.price,
      imageId: data.imageId ?? "",
      available: data.available ?? true,
      sortOrder: data.sortOrder ?? 0,
      taxRate: data.taxRate ?? 19.0,
      customizations: data.customizations ?? "[]",
    },
    [
      Permission.read(Role.any()),
      Permission.update(Role.user(data.ownerId)),
      Permission.delete(Role.user(data.ownerId)),
    ],
  );

  return doc as unknown as MenuItem;
}

export async function updateMenuItem(
  id: string,
  data: Partial<CreateMenuItemData>,
) {
  const { tablesDB } = createAdminClient();
  return tablesDB.updateDocument(
    DATABASE_ID,
    COLLECTIONS.MENU_ITEMS,
    id,
    data,
  );
}

export async function deleteMenuItem(id: string) {
  const { tablesDB } = createAdminClient();
  return tablesDB.deleteDocument(
    DATABASE_ID,
    COLLECTIONS.MENU_ITEMS,
    id,
  );
}

export async function updateCategorySortOrders(
  updates: { id: string; sortOrder: number }[],
) {
  const { tablesDB } = createAdminClient();

  await Promise.all(
    updates.map((u) =>
      tablesDB.updateDocument(DATABASE_ID, COLLECTIONS.MENU_CATEGORIES, u.id, {
        sortOrder: u.sortOrder,
      }),
    ),
  );
}

export async function updateItemSortOrders(
  updates: { id: string; sortOrder: number; categoryId?: string }[],
) {
  const { tablesDB } = createAdminClient();

  await Promise.all(
    updates.map((u) => {
      const payload: Record<string, any> = {
        sortOrder: u.sortOrder,
      };
      if (u.categoryId) {
        payload.categoryId = u.categoryId;
      }
      return tablesDB.updateDocument(
        DATABASE_ID,
        COLLECTIONS.MENU_ITEMS,
        u.id,
        payload,
      );
    }),
  );
}

// ─── Orders ─────────────────────────────────────────────────────

export async function getOrders(
  organizationId: string,
  status?: string,
): Promise<Order[]> {
  const { tablesDB } = createAdminClient();

  const queries = [
    Query.equal("organizationId", organizationId),
    Query.orderDesc("$createdAt"),
    Query.limit(100),
  ];

  if (status) {
    queries.push(Query.equal("status", status));
  }

  const result = await tablesDB.listDocuments(
    DATABASE_ID,
    COLLECTIONS.ORDERS,
    queries,
  );

  return result.documents as unknown as Order[];
}

export async function getOrder(id: string): Promise<Order | null> {
  const { tablesDB } = createAdminClient();

  try {
    const doc = await tablesDB.getDocument(DATABASE_ID, COLLECTIONS.ORDERS, id);
    return doc as unknown as Order;
  } catch {
    return null;
  }
}

export async function createOrder(data: CreateOrderData): Promise<Order> {
  const { tablesDB } = createAdminClient();

  // Query the last created order for this organization to calculate rolling 3-digit order number (001 - 999)
  let nextNum = 1;
  try {
    const lastOrdersResult = await tablesDB.listDocuments(
      DATABASE_ID,
      COLLECTIONS.ORDERS,
      [
        Query.equal("organizationId", data.organizationId),
        Query.orderDesc("$createdAt"),
        Query.limit(1),
      ],
    );

    if (lastOrdersResult.documents.length > 0) {
      const lastNumStr = lastOrdersResult.documents[0].orderNumber;
      const lastNum = parseInt(lastNumStr, 10);
      if (!isNaN(lastNum)) {
        nextNum = (lastNum % 999) + 1;
      }
    }
  } catch (error) {
    console.error("Failed to fetch last order number, defaulting to 001", error);
  }

  const orderNumber = String(nextNum).padStart(3, "0");

  const doc = await tablesDB.createDocument(
    DATABASE_ID,
    COLLECTIONS.ORDERS,
    ID.unique(),
    {
      organizationId: data.organizationId,
      tableNumber: data.tableNumber ?? "",
      type: data.type,
      items: JSON.stringify(data.items),
      total: data.total,
      status: "in_progress",
      email: data.email,
      orderNumber,
      stripePaymentId: data.stripePaymentId ?? "",
      zakkigFee: data.zakkigFee,
      stripeFee: data.stripeFee,
      netAmount: data.netAmount,
      currency: data.currency ?? "EUR",
    },
    [Permission.read(Role.any()), Permission.update(Role.any())],
  );

  return doc as unknown as Order;
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { tablesDB } = createAdminClient();

  return tablesDB.updateDocument(DATABASE_ID, COLLECTIONS.ORDERS, orderId, {
    status,
  });
}

// ─── Order Sessions ───────────────────────────────────────────

export async function getOrderSessions(
  organizationId: string,
): Promise<OrderSession[]> {
  const { tablesDB } = createAdminClient();

  const result = await tablesDB.listDocuments(
    DATABASE_ID,
    COLLECTIONS.ORDERS_SESSIONS,
    [
      Query.equal("organizationId", organizationId),
      Query.orderDesc("$createdAt"),
      Query.limit(10),
    ],
  );

  return result.documents as unknown as OrderSession[];
}

export async function createOrderSession(
  organizationId: string,
  ownerId: string,
): Promise<OrderSession> {
  const { tablesDB } = createAdminClient();

  const token = crypto.randomUUID();

  const doc = await tablesDB.createDocument(
    DATABASE_ID,
    COLLECTIONS.ORDERS_SESSIONS,
    ID.unique(),
    {
      organizationId,
      token,
      expiresAt: null,
    },
    [
      Permission.read(Role.user(ownerId)),
      Permission.update(Role.user(ownerId)),
      Permission.delete(Role.user(ownerId)),
    ],
  );

  return doc as unknown as OrderSession;
}

export async function deleteOrderSession(id: string) {
  const { tablesDB } = createAdminClient();

  return tablesDB.deleteDocument(
    DATABASE_ID,
    COLLECTIONS.ORDERS_SESSIONS,
    id,
  );
}

// ─── Availability Sessions ────────────────────────────────────

export async function getAvailabilitySessions(
  organizationId: string,
): Promise<AvailabilitySession[]> {
  const { tablesDB } = createAdminClient();

  const result = await tablesDB.listDocuments(
    DATABASE_ID,
    COLLECTIONS.AVAILABILITY_SESSIONS,
    [
      Query.equal("organizationId", organizationId),
      Query.orderDesc("$createdAt"),
      Query.limit(10),
    ],
  );

  return result.documents as unknown as AvailabilitySession[];
}

export async function createAvailabilitySession(
  organizationId: string,
  ownerId: string,
): Promise<AvailabilitySession> {
  const { tablesDB } = createAdminClient();

  const token = crypto.randomUUID();

  const doc = await tablesDB.createDocument(
    DATABASE_ID,
    COLLECTIONS.AVAILABILITY_SESSIONS,
    ID.unique(),
    {
      organizationId,
      token,
      expiresAt: null,
    },
    [
      Permission.read(Role.user(ownerId)),
      Permission.update(Role.user(ownerId)),
      Permission.delete(Role.user(ownerId)),
    ],
  );

  return doc as unknown as AvailabilitySession;
}

export async function deleteAvailabilitySession(id: string) {
  const { tablesDB } = createAdminClient();

  return tablesDB.deleteDocument(
    DATABASE_ID,
    COLLECTIONS.AVAILABILITY_SESSIONS,
    id,
  );
}
