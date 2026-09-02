import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getCategories = query({
  args: { organizationId: v.id("organizations") },
  returns: v.array(
    v.object({
      _id: v.id("menuCategories"),
      _creationTime: v.number(),
      organizationId: v.id("organizations"),
      name: v.string(),
      sortOrder: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("menuCategories")
      .withIndex("by_organizationId_and_sortOrder", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();
  },
});

export const getItems = query({
  args: { organizationId: v.id("organizations") },
  returns: v.array(
    v.object({
      _id: v.id("menuItems"),
      _creationTime: v.number(),
      organizationId: v.id("organizations"),
      categoryId: v.id("menuCategories"),
      name: v.string(),
      description: v.optional(v.string()),
      price: v.number(),
      imageStorageId: v.optional(v.union(v.id("_storage"), v.null())),
      imageUrl: v.union(v.string(), v.null()),
      available: v.boolean(),
      sortOrder: v.number(),
      taxRate: v.number(),
      customizations: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("menuItems")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();

    return await Promise.all(
      items.map(async (item) => {
        let imageUrl: string | null = null;
        if (item.imageStorageId) {
          imageUrl = await ctx.storage.getUrl(item.imageStorageId);
        }
        return {
          ...item,
          imageUrl,
        };
      })
    );
  },
});

export const getAvailableItems = query({
  args: { organizationId: v.id("organizations") },
  returns: v.array(
    v.object({
      _id: v.id("menuItems"),
      _creationTime: v.number(),
      organizationId: v.id("organizations"),
      categoryId: v.id("menuCategories"),
      name: v.string(),
      description: v.optional(v.string()),
      price: v.number(),
      imageStorageId: v.optional(v.union(v.id("_storage"), v.null())),
      imageUrl: v.union(v.string(), v.null()),
      available: v.boolean(),
      sortOrder: v.number(),
      taxRate: v.number(),
      customizations: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("menuItems")
      .withIndex("by_organizationId_and_available", (q) =>
        q.eq("organizationId", args.organizationId).eq("available", true)
      )
      .collect();

    return await Promise.all(
      items.map(async (item) => {
        let imageUrl: string | null = null;
        if (item.imageStorageId) {
          imageUrl = await ctx.storage.getUrl(item.imageStorageId);
        }
        return {
          ...item,
          imageUrl,
        };
      })
    );
  },
});

export const getItem = query({
  args: { id: v.id("menuItems") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("menuItems"),
      _creationTime: v.number(),
      organizationId: v.id("organizations"),
      categoryId: v.id("menuCategories"),
      name: v.string(),
      description: v.optional(v.string()),
      price: v.number(),
      imageStorageId: v.optional(v.union(v.id("_storage"), v.null())),
      imageUrl: v.union(v.string(), v.null()),
      available: v.boolean(),
      sortOrder: v.number(),
      taxRate: v.number(),
      customizations: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) return null;

    let imageUrl: string | null = null;
    if (item.imageStorageId) {
      imageUrl = await ctx.storage.getUrl(item.imageStorageId);
    }
    return {
      ...item,
      imageUrl,
    };
  },
});

export const createCategory = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    sortOrder: v.number(),
  },
  returns: v.id("menuCategories"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("menuCategories", {
      organizationId: args.organizationId,
      name: args.name,
      sortOrder: args.sortOrder,
    });
  },
});

export const updateCategory = mutation({
  args: {
    id: v.id("menuCategories"),
    name: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...patch } = args;
    await ctx.db.patch(id, patch);
    return null;
  },
});

export const deleteCategory = mutation({
  args: { id: v.id("menuCategories") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Cascade delete items in this category
    const items = await ctx.db
      .query("menuItems")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", args.id))
      .collect();

    for (const item of items) {
      if (item.imageStorageId) {
        await ctx.storage.delete(item.imageStorageId);
      }
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(args.id);
    return null;
  },
});

export const createItem = mutation({
  args: {
    organizationId: v.id("organizations"),
    categoryId: v.id("menuCategories"),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    imageStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    available: v.boolean(),
    sortOrder: v.number(),
    taxRate: v.number(),
    customizations: v.string(),
  },
  returns: v.id("menuItems"),
  handler: async (ctx, args) => {
    const itemData = {
      ...args,
      imageStorageId: args.imageStorageId || undefined,
    };
    return await ctx.db.insert("menuItems", itemData);
  },
});

export const updateItem = mutation({
  args: {
    id: v.id("menuItems"),
    categoryId: v.optional(v.id("menuCategories")),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    imageStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    clearImage: v.optional(v.boolean()),
    available: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
    taxRate: v.optional(v.number()),
    customizations: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, clearImage, ...patch } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Item not found");

    if (clearImage && existing.imageStorageId) {
      await ctx.storage.delete(existing.imageStorageId);
      patch.imageStorageId = undefined;
    } else if (args.imageStorageId && existing.imageStorageId && existing.imageStorageId !== args.imageStorageId) {
      await ctx.storage.delete(existing.imageStorageId);
    }

    if (patch.imageStorageId === null) {
      patch.imageStorageId = undefined;
    }

    await ctx.db.patch(id, patch);
    return null;
  },
});

export const deleteItem = mutation({
  args: { id: v.id("menuItems") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) return null;

    if (item.imageStorageId) {
      await ctx.storage.delete(item.imageStorageId);
    }
    await ctx.db.delete(args.id);
    return null;
  },
});

export const updateCategorySortOrders = mutation({
  args: {
    updates: v.array(
      v.object({
        id: v.id("menuCategories"),
        sortOrder: v.number(),
      })
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const update of args.updates) {
      await ctx.db.patch(update.id, { sortOrder: update.sortOrder });
    }
    return null;
  },
});

export const updateItemSortOrders = mutation({
  args: {
    updates: v.array(
      v.object({
        id: v.id("menuItems"),
        sortOrder: v.number(),
        categoryId: v.optional(v.id("menuCategories")),
      })
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const update of args.updates) {
      const patch: { sortOrder: number; categoryId?: typeof update.categoryId } = {
        sortOrder: update.sortOrder,
      };
      if (update.categoryId) {
        patch.categoryId = update.categoryId;
      }
      await ctx.db.patch(update.id, patch);
    }
    return null;
  },
});
