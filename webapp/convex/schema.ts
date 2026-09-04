import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  organizations: defineTable({
    name: v.string(),
    address: v.optional(v.string()),
    logoStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    bannerStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    ownerId: v.string(), // references auth user ID
    stripeAccountId: v.optional(v.string()),
    stripeOnboardingComplete: v.optional(v.boolean()),
    isToGoEnabled: v.optional(v.boolean()),
    isToStayEnabled: v.optional(v.boolean()),
    legalName: v.optional(v.string()),
    taxId: v.optional(v.string()),
    currency: v.optional(v.string()),
    deletionRequested: v.optional(v.boolean()),
    tables: v.optional(v.array(v.string())),
  }).index("by_ownerId", ["ownerId"]),

  menuCategories: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    sortOrder: v.number(),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_organizationId_and_sortOrder", ["organizationId", "sortOrder"]),

  menuItems: defineTable({
    organizationId: v.id("organizations"),
    categoryId: v.id("menuCategories"),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(), // in cents
    imageStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    available: v.boolean(),
    sortOrder: v.number(),
    taxRate: v.number(),
    customizations: v.string(), // JSON stringified CustomizationStep[]
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_organizationId_and_available", ["organizationId", "available"])
    .index("by_categoryId", ["categoryId"]),

  orders: defineTable({
    organizationId: v.id("organizations"),
    tableNumber: v.optional(v.string()),
    type: v.union(v.literal("dine-in"), v.literal("takeaway")),
    items: v.string(), // JSON stringified OrderItem[]
    total: v.number(), // in cents
    status: v.union(v.literal("in_progress"), v.literal("completed"), v.literal("cancelled")),
    completedAt: v.optional(v.number()),
    createdAt: v.optional(v.number()),
    email: v.string(),
    orderNumber: v.string(), // 3-digit rolling number e.g. "001"
    stripePaymentId: v.optional(v.string()),
    zakkigFee: v.number(), // in cents
    stripeFee: v.number(), // in cents
    netAmount: v.number(), // in cents
    currency: v.string(),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_organizationId_and_status", ["organizationId", "status"])
    .index("by_stripePaymentId", ["stripePaymentId"]),

  orderSessions: defineTable({
    organizationId: v.id("organizations"),
    token: v.string(),
    expiresAt: v.optional(v.string()),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_token", ["token"]),

  availabilitySessions: defineTable({
    organizationId: v.id("organizations"),
    token: v.string(),
    expiresAt: v.optional(v.string()),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_token", ["token"]),

  verificationCodes: defineTable({
    identifier: v.string(),
    code: v.string(),
    expires: v.number(),
  }).index("by_identifier", ["identifier"]),
});
