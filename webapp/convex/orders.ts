import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const getLiveOrders = query({
  args: { organizationId: v.id("organizations") },
  returns: v.array(
    v.object({
      _id: v.id("orders"),
      _creationTime: v.number(),
      organizationId: v.id("organizations"),
      tableNumber: v.optional(v.string()),
      type: v.union(v.literal("dine-in"), v.literal("takeaway")),
      items: v.string(),
      total: v.number(),
      status: v.union(v.literal("in_progress"), v.literal("completed"), v.literal("cancelled")),
      completedAt: v.optional(v.number()),
      createdAt: v.optional(v.number()),
      email: v.string(),
      orderNumber: v.string(),
      stripePaymentId: v.optional(v.string()),
      zakkigFee: v.number(),
      stripeFee: v.number(),
      netAmount: v.number(),
      currency: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const inProgress = await ctx.db
      .query("orders")
      .withIndex("by_organizationId_and_status", (q) =>
        q.eq("organizationId", args.organizationId).eq("status", "in_progress")
      )
      .order("desc")
      .collect();

    const recentCompleted = await ctx.db
      .query("orders")
      .withIndex("by_organizationId_and_status", (q) =>
        q.eq("organizationId", args.organizationId).eq("status", "completed")
      )
      .order("desc")
      .take(20);

    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    const activeCompleted = recentCompleted.filter((o) => {
      const timestamp = o.completedAt || o._creationTime;
      return timestamp > fifteenMinutesAgo;
    });

    return [...inProgress, ...activeCompleted];
  },
});

export const getOrders = query({
  args: {
    organizationId: v.id("organizations"),
    status: v.optional(
      v.union(v.literal("in_progress"), v.literal("completed"), v.literal("cancelled"))
    ),
  },
  returns: v.array(
    v.object({
      _id: v.id("orders"),
      _creationTime: v.number(),
      organizationId: v.id("organizations"),
      tableNumber: v.optional(v.string()),
      type: v.union(v.literal("dine-in"), v.literal("takeaway")),
      items: v.string(),
      total: v.number(),
      status: v.union(v.literal("in_progress"), v.literal("completed"), v.literal("cancelled")),
      completedAt: v.optional(v.number()),
      createdAt: v.optional(v.number()),
      email: v.string(),
      orderNumber: v.string(),
      stripePaymentId: v.optional(v.string()),
      zakkigFee: v.number(),
      stripeFee: v.number(),
      netAmount: v.number(),
      currency: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("orders")
        .withIndex("by_organizationId_and_status", (q) =>
          q.eq("organizationId", args.organizationId).eq("status", args.status!)
        )
        .order("desc")
        .take(100);
    }

    return await ctx.db
      .query("orders")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .order("desc")
      .take(100);
  },
});

export const getOrder = query({
  args: { id: v.id("orders") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("orders"),
      _creationTime: v.number(),
      organizationId: v.id("organizations"),
      tableNumber: v.optional(v.string()),
      type: v.union(v.literal("dine-in"), v.literal("takeaway")),
      items: v.string(),
      total: v.number(),
      status: v.union(v.literal("in_progress"), v.literal("completed"), v.literal("cancelled")),
      completedAt: v.optional(v.number()),
      createdAt: v.optional(v.number()),
      email: v.string(),
      orderNumber: v.string(),
      stripePaymentId: v.optional(v.string()),
      zakkigFee: v.number(),
      stripeFee: v.number(),
      netAmount: v.number(),
      currency: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    if (!order) return null;
    return {
      ...order,
      zakkigFee: 0,
      stripeFee: 0,
      netAmount: 0,
    };
  },
});

export const getOrderByPaymentIntent = query({
  args: { stripePaymentId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("orders"),
      _creationTime: v.number(),
      organizationId: v.id("organizations"),
      tableNumber: v.optional(v.string()),
      type: v.union(v.literal("dine-in"), v.literal("takeaway")),
      items: v.string(),
      total: v.number(),
      status: v.union(v.literal("in_progress"), v.literal("completed"), v.literal("cancelled")),
      completedAt: v.optional(v.number()),
      createdAt: v.optional(v.number()),
      email: v.string(),
      orderNumber: v.string(),
      stripePaymentId: v.optional(v.string()),
      zakkigFee: v.number(),
      stripeFee: v.number(),
      netAmount: v.number(),
      currency: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_stripePaymentId", (q) =>
        q.eq("stripePaymentId", args.stripePaymentId)
      )
      .first();
    if (!order) return null;
    return {
      ...order,
      zakkigFee: 0,
      stripeFee: 0,
      netAmount: 0,
    };
  },
});

export const createOrder = mutation({
  args: {
    organizationId: v.id("organizations"),
    tableNumber: v.optional(v.string()),
    type: v.union(v.literal("dine-in"), v.literal("takeaway")),
    items: v.string(),
    total: v.number(),
    email: v.string(),
    stripePaymentId: v.optional(v.string()),
    zakkigFee: v.number(),
    stripeFee: v.number(),
    netAmount: v.number(),
    currency: v.optional(v.string()),
  },
  returns: v.object({
    _id: v.id("orders"),
    orderNumber: v.string(),
  }),
  handler: async (ctx, args) => {
    // 1. Rolling 3-digit order number (001 - 999) calculated atomically in transaction
    const latestOrder = await ctx.db
      .query("orders")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .order("desc")
      .first();

    let nextNum = 1;
    if (latestOrder) {
      const parsed = parseInt(latestOrder.orderNumber, 10);
      if (!isNaN(parsed) && parsed >= 1) {
        nextNum = (parsed % 999) + 1;
      }
    }
    const orderNumber = String(nextNum).padStart(3, "0");

    const orderId = await ctx.db.insert("orders", {
      organizationId: args.organizationId,
      tableNumber: args.tableNumber,
      type: args.type,
      items: args.items,
      total: args.total,
      status: "in_progress",
      createdAt: Date.now(),
      email: args.email,
      orderNumber,
      stripePaymentId: args.stripePaymentId,
      zakkigFee: args.zakkigFee,
      stripeFee: args.stripeFee,
      netAmount: args.netAmount,
      currency: args.currency ?? "EUR",
    });

    return {
      _id: orderId,
      orderNumber,
    };
  },
});

export const createPaidOrderFromWebhook = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    tableNumber: v.optional(v.string()),
    type: v.union(v.literal("dine-in"), v.literal("takeaway")),
    items: v.string(),
    total: v.number(),
    email: v.string(),
    stripePaymentId: v.string(),
    currency: v.string(),
  },
  returns: v.id("orders"),
  handler: async (ctx, args) => {
    // Prevent duplicate orders for the same payment intent
    const existing = await ctx.db
      .query("orders")
      .withIndex("by_stripePaymentId", (q) =>
        q.eq("stripePaymentId", args.stripePaymentId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    const latestOrder = await ctx.db
      .query("orders")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .order("desc")
      .first();

    let nextNum = 1;
    if (latestOrder) {
      const parsed = parseInt(latestOrder.orderNumber, 10);
      if (!isNaN(parsed) && parsed >= 1) {
        nextNum = (parsed % 999) + 1;
      }
    }
    const orderNumber = String(nextNum).padStart(3, "0");

    const zakkigFee = Math.round(args.total * 0.01);
    const stripeFee = 0; // Stripe deducts directly from merchant
    const netAmount = args.total - zakkigFee;

    return await ctx.db.insert("orders", {
      organizationId: args.organizationId,
      tableNumber: args.tableNumber,
      type: args.type,
      items: args.items,
      total: args.total,
      status: "in_progress",
      email: args.email,
      orderNumber,
      stripePaymentId: args.stripePaymentId,
      zakkigFee,
      stripeFee,
      netAmount,
      currency: args.currency,
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("orders"),
    status: v.union(v.literal("in_progress"), v.literal("completed"), v.literal("cancelled")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const patchData: {
      status: "in_progress" | "completed" | "cancelled";
      completedAt?: number;
    } = { status: args.status };
    if (args.status === "completed") {
      patchData.completedAt = Date.now();
    }
    await ctx.db.patch(args.id, patchData);
    return null;
  },
});
