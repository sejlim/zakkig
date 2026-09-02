import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { id: v.id("organizations") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("organizations"),
      _creationTime: v.number(),
      name: v.string(),
      address: v.optional(v.string()),
      logoStorageId: v.optional(v.union(v.id("_storage"), v.null())),
      logoUrl: v.union(v.string(), v.null()),
      bannerStorageId: v.optional(v.union(v.id("_storage"), v.null())),
      bannerUrl: v.union(v.string(), v.null()),
      ownerId: v.string(),
      stripeAccountId: v.optional(v.string()),
      stripeOnboardingComplete: v.optional(v.boolean()),
      isToGoEnabled: v.optional(v.boolean()),
      isToStayEnabled: v.optional(v.boolean()),
      legalName: v.optional(v.string()),
      taxId: v.optional(v.string()),
      currency: v.optional(v.string()),
      deletionRequested: v.optional(v.boolean()),
      tables: v.optional(v.array(v.string())),
    })
  ),
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.id);
    if (!org) return null;

    let logoUrl: string | null = null;
    if (org.logoStorageId) {
      logoUrl = await ctx.storage.getUrl(org.logoStorageId);
    }
    let bannerUrl: string | null = null;
    if (org.bannerStorageId) {
      bannerUrl = await ctx.storage.getUrl(org.bannerStorageId);
    }

    return {
      ...org,
      logoUrl,
      bannerUrl,
    };
  },
});

export const getByOwner = query({
  args: { ownerId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("organizations"),
      _creationTime: v.number(),
      name: v.string(),
      address: v.optional(v.string()),
      logoStorageId: v.optional(v.union(v.id("_storage"), v.null())),
      logoUrl: v.union(v.string(), v.null()),
      bannerStorageId: v.optional(v.union(v.id("_storage"), v.null())),
      bannerUrl: v.union(v.string(), v.null()),
      ownerId: v.string(),
      stripeAccountId: v.optional(v.string()),
      stripeOnboardingComplete: v.optional(v.boolean()),
      isToGoEnabled: v.optional(v.boolean()),
      isToStayEnabled: v.optional(v.boolean()),
      legalName: v.optional(v.string()),
      taxId: v.optional(v.string()),
      currency: v.optional(v.string()),
      deletionRequested: v.optional(v.boolean()),
      tables: v.optional(v.array(v.string())),
    })
  ),
  handler: async (ctx, args) => {
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", args.ownerId))
      .first();

    if (!org) return null;

    let logoUrl: string | null = null;
    if (org.logoStorageId) {
      logoUrl = await ctx.storage.getUrl(org.logoStorageId);
    }
    let bannerUrl: string | null = null;
    if (org.bannerStorageId) {
      bannerUrl = await ctx.storage.getUrl(org.bannerStorageId);
    }

    return {
      ...org,
      logoUrl,
      bannerUrl,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    ownerId: v.string(),
    address: v.optional(v.string()),
    logoStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    bannerStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    legalName: v.optional(v.string()),
    taxId: v.optional(v.string()),
    currency: v.optional(v.string()),
    tables: v.optional(v.array(v.string())),
  },
  returns: v.id("organizations"),
  handler: async (ctx, args) => {
    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      ownerId: args.ownerId,
      address: args.address,
      logoStorageId: args.logoStorageId || undefined,
      bannerStorageId: args.bannerStorageId || undefined,
      stripeAccountId: undefined,
      stripeOnboardingComplete: false,
      isToGoEnabled: false,
      isToStayEnabled: false,
      legalName: args.legalName,
      taxId: args.taxId,
      currency: args.currency ?? "EUR",
      deletionRequested: false,
      tables: args.tables ?? [],
    });

    return orgId;
  },
});

export const update = mutation({
  args: {
    id: v.id("organizations"),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    logoStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    clearLogo: v.optional(v.boolean()),
    bannerStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    clearBanner: v.optional(v.boolean()),
    stripeAccountId: v.optional(v.string()),
    stripeOnboardingComplete: v.optional(v.boolean()),
    isToGoEnabled: v.optional(v.boolean()),
    isToStayEnabled: v.optional(v.boolean()),
    legalName: v.optional(v.string()),
    taxId: v.optional(v.string()),
    currency: v.optional(v.string()),
    deletionRequested: v.optional(v.boolean()),
    tables: v.optional(v.array(v.string())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, clearLogo, clearBanner, ...patchData } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Organization not found");

    if (clearLogo && existing.logoStorageId) {
      try {
        await ctx.storage.delete(existing.logoStorageId);
      } catch {
        // ignore if already deleted
      }
      patchData.logoStorageId = undefined;
    } else if (args.logoStorageId && existing.logoStorageId && existing.logoStorageId !== args.logoStorageId) {
      try {
        await ctx.storage.delete(existing.logoStorageId);
      } catch {
        // ignore if already deleted
      }
    }

    if (patchData.logoStorageId === null) {
      patchData.logoStorageId = undefined;
    }

    if (clearBanner && existing.bannerStorageId) {
      try {
        await ctx.storage.delete(existing.bannerStorageId);
      } catch {
        // ignore if already deleted
      }
      patchData.bannerStorageId = undefined;
    } else if (args.bannerStorageId && existing.bannerStorageId && existing.bannerStorageId !== args.bannerStorageId) {
      try {
        await ctx.storage.delete(existing.bannerStorageId);
      } catch {
        // ignore if already deleted
      }
    }

    if (patchData.bannerStorageId === null) {
      patchData.bannerStorageId = undefined;
    }

    await ctx.db.patch(id, patchData);
    return null;
  },
});

export const cascadeDelete = internalMutation({
  args: { organizationId: v.id("organizations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.organizationId);
    if (!org) return null;

    if (org.logoStorageId) {
      await ctx.storage.delete(org.logoStorageId);
    }
    if (org.bannerStorageId) {
      await ctx.storage.delete(org.bannerStorageId);
    }

    // Delete categories
    const categories = await ctx.db
      .query("menuCategories")
      .withIndex("by_organizationId", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    for (const cat of categories) {
      await ctx.db.delete(cat._id);
    }

    // Delete items & their images
    const items = await ctx.db
      .query("menuItems")
      .withIndex("by_organizationId", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    for (const item of items) {
      if (item.imageStorageId) {
        await ctx.storage.delete(item.imageStorageId);
      }
      await ctx.db.delete(item._id);
    }

    // Delete orders
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_organizationId", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    for (const order of orders) {
      await ctx.db.delete(order._id);
    }

    // Delete order sessions
    const orderSessions = await ctx.db
      .query("orderSessions")
      .withIndex("by_organizationId", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    for (const s of orderSessions) {
      await ctx.db.delete(s._id);
    }

    // Delete availability sessions
    const availSessions = await ctx.db
      .query("availabilitySessions")
      .withIndex("by_organizationId", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    for (const s of availSessions) {
      await ctx.db.delete(s._id);
    }

    // Delete the organization itself
    await ctx.db.delete(args.organizationId);
    return null;
  },
});

export const listAll = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await ctx.db.query("organizations").take(10);
  },
});
