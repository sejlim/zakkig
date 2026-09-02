import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const currentUser = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      image: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

export const updateName = mutation({
  args: { name: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    await ctx.db.patch(userId, { name: args.name });
    return null;
  },
});

export const requestEmailChange = mutation({
  args: {
    appUrl: v.string(),
    locale: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (!user || !user.email) throw new Error("User not found");

    const token = crypto.randomUUID();
    const expires = Date.now() + 15 * 60 * 1000;

    await ctx.db.insert("verificationCodes", {
      identifier: `email_change_${userId}`,
      code: token,
      expires,
    });

    const changeUrl = `${args.appUrl}/change-email/confirm?userId=${userId}&token=${token}`;
    await ctx.scheduler.runAfter(0, internal.emails.sendChangeEmailLink, {
      to: user.email,
      changeUrl,
      locale: args.locale,
    });

    return { success: true };
  },
});

export const sendNewEmailOtp = mutation({
  args: {
    token: v.string(),
    newEmail: v.string(),
    locale: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const tokenRecord = await ctx.db
      .query("verificationCodes")
      .withIndex("by_identifier", (q) => q.eq("identifier", `email_change_${userId}`))
      .first();

    if (!tokenRecord || tokenRecord.code !== args.token || Date.now() > tokenRecord.expires) {
      return { success: false, error: "Token expired or invalid" };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 15 * 60 * 1000;

    await ctx.db.insert("verificationCodes", {
      identifier: `new_email_otp_${userId}`,
      code: `${args.newEmail}:::${otp}`,
      expires,
    });

    await ctx.scheduler.runAfter(0, internal.emails.sendEmailOtp, {
      to: args.newEmail,
      code: otp,
      locale: args.locale,
    });

    return { success: true };
  },
});

export const confirmEmailChange = mutation({
  args: {
    token: v.string(),
    newEmail: v.string(),
    otp: v.string(),
  },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const tokenRecord = await ctx.db
      .query("verificationCodes")
      .withIndex("by_identifier", (q) => q.eq("identifier", `email_change_${userId}`))
      .first();
    if (!tokenRecord || tokenRecord.code !== args.token) {
      return { success: false, error: "Invalid token" };
    }

    const otpRecord = await ctx.db
      .query("verificationCodes")
      .withIndex("by_identifier", (q) => q.eq("identifier", `new_email_otp_${userId}`))
      .first();
    if (!otpRecord || otpRecord.code !== `${args.newEmail}:::${args.otp}`) {
      return { success: false, error: "Invalid verification code" };
    }
    if (Date.now() > otpRecord.expires) {
      return { success: false, error: "Code expired" };
    }

    await ctx.db.patch(userId, { email: args.newEmail });
    await ctx.db.delete(tokenRecord._id);
    await ctx.db.delete(otpRecord._id);

    return { success: true };
  },
});

export const requestAccountDeletion = mutation({
  args: {
    appUrl: v.string(),
    locale: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (!user || !user.email) throw new Error("User not found");

    const token = crypto.randomUUID();
    const expires = Date.now() + 15 * 60 * 1000;

    await ctx.db.insert("verificationCodes", {
      identifier: `delete_account_${userId}`,
      code: token,
      expires,
    });

    const deleteUrl = `${args.appUrl}/delete-account?userId=${userId}&token=${token}`;
    await ctx.scheduler.runAfter(0, internal.emails.sendDeleteAccountEmail, {
      to: user.email,
      deleteUrl,
      locale: args.locale,
    });

    return { success: true };
  },
});

export const createEmailChangeToken = mutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.object({
    success: v.boolean(),
    token: v.optional(v.string()),
    email: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || !user.email) {
      return { success: false, error: "User not found" };
    }

    const token = crypto.randomUUID();
    const expires = Date.now() + 15 * 60 * 1000;

    const existing = await ctx.db
      .query("verificationCodes")
      .withIndex("by_identifier", (q) => q.eq("identifier", `email_change_${args.userId}`))
      .collect();
    for (const r of existing) {
      await ctx.db.delete(r._id);
    }

    await ctx.db.insert("verificationCodes", {
      identifier: `email_change_${args.userId}`,
      code: token,
      expires,
    });

    return { success: true, token, email: user.email };
  },
});

export const storeNewEmailOtp = mutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
    newEmail: v.string(),
    otp: v.string(),
  },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const tokenRecord = await ctx.db
      .query("verificationCodes")
      .withIndex("by_identifier", (q) => q.eq("identifier", `email_change_${args.userId}`))
      .first();

    if (!tokenRecord || tokenRecord.code !== args.token || Date.now() > tokenRecord.expires) {
      return { success: false, error: "Token expired or invalid" };
    }

    const expires = Date.now() + 15 * 60 * 1000;

    const existing = await ctx.db
      .query("verificationCodes")
      .withIndex("by_identifier", (q) => q.eq("identifier", `new_email_otp_${args.userId}`))
      .collect();
    for (const r of existing) {
      await ctx.db.delete(r._id);
    }

    await ctx.db.insert("verificationCodes", {
      identifier: `new_email_otp_${args.userId}`,
      code: `${args.newEmail}:::${args.otp}`,
      expires,
    });

    return { success: true };
  },
});

export const confirmEmailChangeWithOtp = mutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
    newEmail: v.string(),
    otp: v.string(),
  },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const tokenRecord = await ctx.db
      .query("verificationCodes")
      .withIndex("by_identifier", (q) => q.eq("identifier", `email_change_${args.userId}`))
      .first();
    if (!tokenRecord || tokenRecord.code !== args.token) {
      return { success: false, error: "Invalid token" };
    }

    const otpRecord = await ctx.db
      .query("verificationCodes")
      .withIndex("by_identifier", (q) => q.eq("identifier", `new_email_otp_${args.userId}`))
      .first();
    if (!otpRecord || otpRecord.code !== `${args.newEmail}:::${args.otp}`) {
      return { success: false, error: "Invalid verification code" };
    }
    if (Date.now() > otpRecord.expires) {
      return { success: false, error: "Code expired" };
    }

    await ctx.db.patch(args.userId, { email: args.newEmail });
    await ctx.db.delete(tokenRecord._id);
    await ctx.db.delete(otpRecord._id);

    return { success: true };
  },
});

export const createAccountDeletionToken = mutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.object({
    success: v.boolean(),
    token: v.optional(v.string()),
    email: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || !user.email) {
      return { success: false, error: "User not found" };
    }

    const token = crypto.randomUUID();
    const expires = Date.now() + 15 * 60 * 1000;

    const existing = await ctx.db
      .query("verificationCodes")
      .withIndex("by_identifier", (q) => q.eq("identifier", `delete_account_${args.userId}`))
      .collect();
    for (const r of existing) {
      await ctx.db.delete(r._id);
    }

    await ctx.db.insert("verificationCodes", {
      identifier: `delete_account_${args.userId}`,
      code: token,
      expires,
    });

    return { success: true, token, email: user.email };
  },
});

export const confirmAccountDeletion = mutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
  },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("verificationCodes")
      .withIndex("by_identifier", (q) => q.eq("identifier", `delete_account_${args.userId}`))
      .first();

    if (!record || record.code !== args.token || Date.now() > record.expires) {
      return { success: false, error: "Invalid or expired token" };
    }

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", args.userId))
      .first();

    if (org) {
      await ctx.runMutation(internal.organizations.cascadeDelete, {
        organizationId: org._id,
      });
    }

    await ctx.db.delete(record._id);
    await ctx.db.delete(args.userId);

    return { success: true };
  },
});
