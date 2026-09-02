import { query, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const checkEmailExists = query({
  args: { email: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args): Promise<boolean> => {
    const normalized = args.email.toLowerCase().trim();
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", normalized))
      .first();
    return !!user;
  },
});

export const getUserBySession = query({
  args: { sessionToken: v.string() },
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
  handler: async (ctx, args) => {
    const tokenRecord = await ctx.db
      .query("verificationCodes")
      .withIndex("by_identifier", (q) => q.eq("identifier", `session_${args.sessionToken}`))
      .first();

    if (!tokenRecord || Date.now() > tokenRecord.expires) {
      return null;
    }

    const userId = tokenRecord.code as Id<"users">;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return {
      _id: user._id,
      _creationTime: user._creationTime,
      name: user.name,
      email: user.email,
      emailVerificationTime: user.emailVerificationTime,
      image: user.image,
    };
  },
});

export const getCredentialsByEmail = internalQuery({
  args: { email: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      userId: v.string(),
      email: v.string(),
      name: v.optional(v.string()),
      passwordHash: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (!user) return null;

    const account = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", user._id).eq("provider", "password")
      )
      .first();

    return {
      userId: user._id as string,
      email: user.email || args.email,
      name: user.name,
      passwordHash: account?.secret,
    };
  },
});

export const createUserWithHash = internalMutation({
  args: {
    email: v.string(),
    name: v.string(),
    passwordHash: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args): Promise<string> => {
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
    });

    await ctx.db.insert("authAccounts", {
      userId,
      provider: "password",
      providerAccountId: args.email,
      secret: args.passwordHash,
    });

    return userId;
  },
});

export const storeOtp = internalMutation({
  args: {
    userId: v.string(),
    otp: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const existing = await ctx.db
      .query("verificationCodes")
      .withIndex("by_identifier", (q) => q.eq("identifier", `otp_${args.userId}`))
      .collect();

    for (const r of existing) {
      await ctx.db.delete(r._id);
    }

    await ctx.db.insert("verificationCodes", {
      identifier: `otp_${args.userId}`,
      code: args.otp,
      expires: Date.now() + 15 * 60 * 1000,
    });

    return null;
  },
});

export const validateOtpAndConsume = internalMutation({
  args: {
    userId: v.string(),
    otp: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args): Promise<boolean> => {
    const record = await ctx.db
      .query("verificationCodes")
      .withIndex("by_identifier", (q) => q.eq("identifier", `otp_${args.userId}`))
      .first();

    if (!record || record.code !== args.otp || Date.now() > record.expires) {
      return false;
    }

    await ctx.db.delete(record._id);

    const user = await ctx.db.get(args.userId as Id<"users">);
    if (user) {
      await ctx.db.patch(user._id, { emailVerificationTime: Date.now() });
    }

    return true;
  },
});

export const createSessionToken = internalMutation({
  args: {
    userId: v.string(),
    sessionToken: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    await ctx.db.insert("verificationCodes", {
      identifier: `session_${args.sessionToken}`,
      code: args.userId,
      expires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    return null;
  },
});

export const storeResetToken = internalMutation({
  args: {
    userId: v.string(),
    secret: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const existing = await ctx.db
      .query("verificationCodes")
      .withIndex("by_identifier", (q) => q.eq("identifier", `reset_${args.userId}`))
      .collect();

    for (const r of existing) {
      await ctx.db.delete(r._id);
    }

    await ctx.db.insert("verificationCodes", {
      identifier: `reset_${args.userId}`,
      code: args.secret,
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });
    return null;
  },
});

export const validateResetToken = internalMutation({
  args: {
    userId: v.string(),
    secret: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args): Promise<boolean> => {
    const record = await ctx.db
      .query("verificationCodes")
      .withIndex("by_identifier", (q) => q.eq("identifier", `reset_${args.userId}`))
      .first();

    if (!record || record.code !== args.secret || Date.now() > record.expires) {
      return false;
    }

    await ctx.db.delete(record._id);
    return true;
  },
});

export const updatePasswordHash = internalMutation({
  args: {
    userId: v.string(),
    passwordHash: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", args.userId as Id<"users">).eq("provider", "password")
      )
      .first();

    if (account) {
      await ctx.db.patch(account._id, { secret: args.passwordHash });
    }
    return null;
  },
});
