import "server-only";

import { convexServer } from "./server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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

// Helper to normalize Convex documents with $id and $createdAt aliases
function toOrg(doc: any): Organization {
  return {
    ...doc,
    $id: doc._id,
    $createdAt: new Date(doc._creationTime).toISOString(),
    logoFileId: doc.logoStorageId || "",
    logoUrl: doc.logoUrl || null,
    bannerFileId: doc.bannerStorageId || "",
    bannerUrl: doc.bannerUrl || null,
  };
}

function toCat(doc: any): MenuCategory {
  return {
    ...doc,
    $id: doc._id,
    $createdAt: new Date(doc._creationTime).toISOString(),
  };
}

function toItem(doc: any): MenuItem {
  return {
    ...doc,
    $id: doc._id,
    $createdAt: new Date(doc._creationTime).toISOString(),
    imageId: doc.imageStorageId || "",
    imageUrl: doc.imageUrl || null,
  };
}

function toOrder(doc: any): Order {
  return {
    ...doc,
    $id: doc._id,
    $createdAt: new Date(doc._creationTime).toISOString(),
  };
}

function toSession(doc: any): OrderSession {
  return {
    ...doc,
    $id: doc._id,
    $createdAt: new Date(doc._creationTime).toISOString(),
  };
}

function toStorageId(id?: string | null): Id<"_storage"> | undefined {
  if (!id || typeof id !== "string" || id.trim() === "") return undefined;
  return id as Id<"_storage">;
}

// ─── Organizations ──────────────────────────────────────────────

export async function getOrganizationByOwner(
  ownerId: string,
): Promise<Organization | null> {
  const doc = await convexServer.query(api.organizations.getByOwner, { ownerId });
  return doc ? toOrg(doc) : null;
}

export async function getOrganization(
  id: string,
): Promise<Organization | null> {
  try {
    const doc = await convexServer.query(api.organizations.get, {
      id: id as Id<"organizations">,
    });
    return doc ? toOrg(doc) : null;
  } catch {
    return null;
  }
}

export async function createOrganization(
  data: CreateOrganizationData,
): Promise<Organization> {
  const id = await convexServer.mutation(api.organizations.create, {
    name: data.name,
    ownerId: data.ownerId,
    address: data.address,
    logoStorageId: toStorageId(data.logoStorageId || data.logoFileId),
    legalName: data.legalName,
    taxId: data.taxId,
    currency: data.currency,
    tables: data.tables,
  });

  const created = await convexServer.query(api.organizations.get, { id });
  return toOrg(created!);
}

export async function updateOrganization(
  id: string,
  data: Partial<Organization> & { clearLogo?: boolean; clearBanner?: boolean },
) {
  return await convexServer.mutation(api.organizations.update, {
    id: id as Id<"organizations">,
    name: data.name,
    address: data.address,
    logoStorageId: toStorageId(data.logoStorageId || data.logoFileId),
    clearLogo: data.clearLogo,
    bannerStorageId: toStorageId(data.bannerStorageId || data.bannerFileId),
    clearBanner: data.clearBanner,
    stripeAccountId: data.stripeAccountId,
    stripeOnboardingComplete: data.stripeOnboardingComplete,
    isToGoEnabled: data.isToGoEnabled,
    isToStayEnabled: data.isToStayEnabled,
    legalName: data.legalName,
    taxId: data.taxId,
    currency: data.currency,
    deletionRequested: data.deletionRequested,
    tables: data.tables,
  });
}

// ─── Menu Categories ────────────────────────────────────────────

export async function getMenuCategories(
  organizationId: string,
): Promise<MenuCategory[]> {
  const docs = await convexServer.query(api.menu.getCategories, {
    organizationId: organizationId as Id<"organizations">,
  });
  return docs.map(toCat);
}

export async function createMenuCategory(
  data: CreateMenuCategoryData,
): Promise<MenuCategory> {
  const id = await convexServer.mutation(api.menu.createCategory, {
    organizationId: data.organizationId as Id<"organizations">,
    name: data.name,
    sortOrder: data.sortOrder ?? 0,
  });

  return {
    _id: id,
    $id: id,
    _creationTime: Date.now(),
    organizationId: data.organizationId,
    name: data.name,
    sortOrder: data.sortOrder ?? 0,
  };
}

export async function updateMenuCategory(
  id: string,
  data: { name?: string; sortOrder?: number },
) {
  return await convexServer.mutation(api.menu.updateCategory, {
    id: id as Id<"menuCategories">,
    name: data.name,
    sortOrder: data.sortOrder,
  });
}

export async function deleteMenuCategory(id: string) {
  return await convexServer.mutation(api.menu.deleteCategory, {
    id: id as Id<"menuCategories">,
  });
}

export async function updateCategorySortOrders(
  updates: { id: string; sortOrder: number }[],
) {
  return await convexServer.mutation(api.menu.updateCategorySortOrders, {
    updates: updates.map((u) => ({
      id: u.id as Id<"menuCategories">,
      sortOrder: u.sortOrder,
    })),
  });
}

// ─── Menu Items ─────────────────────────────────────────────────

export async function getMenuItems(
  organizationId: string,
): Promise<MenuItem[]> {
  const docs = await convexServer.query(api.menu.getItems, {
    organizationId: organizationId as Id<"organizations">,
  });
  return docs.map(toItem);
}

export async function getMenuItem(id: string): Promise<MenuItem | null> {
  try {
    const doc = await convexServer.query(api.menu.getItem, {
      id: id as Id<"menuItems">,
    });
    return doc ? toItem(doc) : null;
  } catch {
    return null;
  }
}

export async function getAvailableMenuItems(
  organizationId: string,
): Promise<MenuItem[]> {
  const docs = await convexServer.query(api.menu.getAvailableItems, {
    organizationId: organizationId as Id<"organizations">,
  });
  return docs.map(toItem);
}

export async function createMenuItem(
  data: CreateMenuItemData,
): Promise<MenuItem> {
  const id = await convexServer.mutation(api.menu.createItem, {
    organizationId: data.organizationId as Id<"organizations">,
    categoryId: data.categoryId as Id<"menuCategories">,
    name: data.name,
    description: data.description,
    price: data.price,
    imageStorageId: toStorageId(data.imageStorageId || data.imageId),
    available: data.available ?? true,
    sortOrder: data.sortOrder ?? 0,
    taxRate: data.taxRate ?? 19.0,
    customizations: data.customizations ?? "[]",
  });

  const doc = await convexServer.query(api.menu.getItem, { id });
  return toItem(doc!);
}

export async function updateMenuItem(
  id: string,
  data: Partial<CreateMenuItemData> & { clearImage?: boolean },
) {
  return await convexServer.mutation(api.menu.updateItem, {
    id: id as Id<"menuItems">,
    categoryId: data.categoryId as Id<"menuCategories"> | undefined,
    name: data.name,
    description: data.description,
    price: data.price,
    imageStorageId: toStorageId(data.imageStorageId || data.imageId),
    clearImage: data.clearImage,
    available: data.available,
    sortOrder: data.sortOrder,
    taxRate: data.taxRate,
    customizations: data.customizations,
  });
}

export async function deleteMenuItem(id: string) {
  return await convexServer.mutation(api.menu.deleteItem, {
    id: id as Id<"menuItems">,
  });
}

export async function updateItemSortOrders(
  updates: { id: string; sortOrder: number; categoryId?: string }[],
) {
  return await convexServer.mutation(api.menu.updateItemSortOrders, {
    updates: updates.map((u) => ({
      id: u.id as Id<"menuItems">,
      sortOrder: u.sortOrder,
      categoryId: u.categoryId as Id<"menuCategories"> | undefined,
    })),
  });
}

// ─── Orders ─────────────────────────────────────────────────────

export async function getOrders(
  organizationId: string,
  status?: "in_progress" | "completed" | "cancelled",
): Promise<Order[]> {
  const docs = await convexServer.query(api.orders.getOrders, {
    organizationId: organizationId as Id<"organizations">,
    status,
  });
  return docs.map(toOrder);
}

export async function getOrder(id: string): Promise<Order | null> {
  try {
    const doc = await convexServer.query(api.orders.getOrder, {
      id: id as Id<"orders">,
    });
    return doc ? toOrder(doc) : null;
  } catch {
    return null;
  }
}

export async function getOrderByPaymentIntent(stripePaymentId: string): Promise<Order | null> {
  const doc = await convexServer.query(api.orders.getOrderByPaymentIntent, {
    stripePaymentId,
  });
  return doc ? toOrder(doc) : null;
}

export async function createOrder(data: CreateOrderData): Promise<Order> {
  const res = await convexServer.mutation(api.orders.createOrder, {
    organizationId: data.organizationId as Id<"organizations">,
    tableNumber: data.tableNumber,
    type: data.type,
    items: JSON.stringify(data.items),
    total: data.total,
    email: data.email,
    stripePaymentId: data.stripePaymentId,
    zakkigFee: data.zakkigFee,
    stripeFee: data.stripeFee,
    netAmount: data.netAmount,
    currency: data.currency,
  });

  const doc = await convexServer.query(api.orders.getOrder, { id: res._id });
  return toOrder(doc!);
}

export async function updateOrderStatus(
  orderId: string,
  status: "in_progress" | "completed" | "cancelled",
) {
  return await convexServer.mutation(api.orders.updateStatus, {
    id: orderId as Id<"orders">,
    status,
  });
}

// ─── Order Sessions ───────────────────────────────────────────

export async function getOrderSessions(
  organizationId: string,
): Promise<OrderSession[]> {
  const docs = await convexServer.query(api.sessions.getOrderSessions, {
    organizationId: organizationId as Id<"organizations">,
  });
  return docs.map(toSession);
}

export async function createOrderSession(
  organizationId: string,
  _ownerId?: string,
): Promise<OrderSession> {
  const res = await convexServer.mutation(api.sessions.createOrderSession, {
    organizationId: organizationId as Id<"organizations">,
  });
  return {
    _id: res._id,
    $id: res._id,
    _creationTime: Date.now(),
    organizationId,
    token: res.token,
    expiresAt: null,
  };
}

export async function deleteOrderSession(id: string) {
  return await convexServer.mutation(api.sessions.deleteOrderSession, {
    id: id as Id<"orderSessions">,
  });
}

// ─── Availability Sessions ────────────────────────────────────

export async function getAvailabilitySessions(
  organizationId: string,
): Promise<AvailabilitySession[]> {
  const docs = await convexServer.query(api.sessions.getAvailabilitySessions, {
    organizationId: organizationId as Id<"organizations">,
  });
  return docs.map(toSession);
}

export async function createAvailabilitySession(
  organizationId: string,
  _ownerId?: string,
): Promise<AvailabilitySession> {
  const res = await convexServer.mutation(api.sessions.createAvailabilitySession, {
    organizationId: organizationId as Id<"organizations">,
  });
  return {
    _id: res._id,
    $id: res._id,
    _creationTime: Date.now(),
    organizationId,
    token: res.token,
    expiresAt: null,
  };
}

export async function deleteAvailabilitySession(id: string) {
  return await convexServer.mutation(api.sessions.deleteAvailabilitySession, {
    id: id as Id<"availabilitySessions">,
  });
}
