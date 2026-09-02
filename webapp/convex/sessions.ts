import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getOrderSessions = query({
  args: { organizationId: v.id("organizations") },
  returns: v.array(
    v.object({
      _id: v.id("orderSessions"),
      _creationTime: v.number(),
      organizationId: v.id("organizations"),
      token: v.string(),
      expiresAt: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orderSessions")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .order("desc")
      .take(10);
  },
});

export const createOrderSession = mutation({
  args: { organizationId: v.id("organizations") },
  returns: v.object({
    _id: v.id("orderSessions"),
    token: v.string(),
  }),
  handler: async (ctx, args) => {
    const token = crypto.randomUUID();
    const id = await ctx.db.insert("orderSessions", {
      organizationId: args.organizationId,
      token,
    });
    return { _id: id, token };
  },
});

export const deleteOrderSession = mutation({
  args: { id: v.id("orderSessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});

export const getAvailabilitySessions = query({
  args: { organizationId: v.id("organizations") },
  returns: v.array(
    v.object({
      _id: v.id("availabilitySessions"),
      _creationTime: v.number(),
      organizationId: v.id("organizations"),
      token: v.string(),
      expiresAt: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("availabilitySessions")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .order("desc")
      .take(10);
  },
});

export const createAvailabilitySession = mutation({
  args: { organizationId: v.id("organizations") },
  returns: v.object({
    _id: v.id("availabilitySessions"),
    token: v.string(),
  }),
  handler: async (ctx, args) => {
    const token = crypto.randomUUID();
    const id = await ctx.db.insert("availabilitySessions", {
      organizationId: args.organizationId,
      token,
    });
    return { _id: id, token };
  },
});

export const deleteAvailabilitySession = mutation({
  args: { id: v.id("availabilitySessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});

export const verifyTerminalSession = query({
  args: {
    organizationId: v.id("organizations"),
    token: v.string(),
    type: v.union(v.literal("orders"), v.literal("availability")),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    if (args.type === "orders") {
      const session = await ctx.db
        .query("orderSessions")
        .withIndex("by_token", (q) => q.eq("token", args.token))
        .first();
      return !!session && session.organizationId === args.organizationId;
    } else {
      const session = await ctx.db
        .query("availabilitySessions")
        .withIndex("by_token", (q) => q.eq("token", args.token))
        .first();
      return !!session && session.organizationId === args.organizationId;
    }
  },
});
