"use node";

import { action } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { v } from "convex/values";
import crypto from "crypto";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, originalHash] = stored.split(":");
    if (!salt || !originalHash) return false;
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(
      Buffer.from(hash, "hex"),
      Buffer.from(originalHash, "hex")
    );
  } catch {
    return false;
  }
}

export const signInWithPassword = action({
  args: {
    email: v.string(),
    password: v.string(),
    locale: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    userId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; userId?: string; error?: string }> => {
    const normalized = args.email.toLowerCase().trim();
    const creds: any = await ctx.runQuery(
      internal.authQueries.getCredentialsByEmail,
      { email: normalized }
    );

    if (!creds || !creds.passwordHash) {
      return { success: false, error: "authError" };
    }

    const isMatch = verifyPassword(args.password, creds.passwordHash);
    if (!isMatch) {
      return { success: false, error: "authError" };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await ctx.runMutation(internal.authQueries.storeOtp, {
      userId: creds.userId,
      otp,
    });

    await ctx.scheduler.runAfter(0, internal.emails.sendEmailOtp, {
      to: normalized,
      code: otp,
      locale: args.locale,
    });

    return { success: true, userId: creds.userId };
  },
});

export const signUpWithPassword = action({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    locale: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    userId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; userId?: string; error?: string }> => {
    const normalized = args.email.toLowerCase().trim();
    const exists: boolean = await ctx.runQuery(
      api.authQueries.checkEmailExists,
      { email: normalized }
    );

    if (exists) {
      return { success: false, error: "authErrorUserExists" };
    }

    const passwordHash = hashPassword(args.password);
    const userId: string = await ctx.runMutation(
      internal.authQueries.createUserWithHash,
      {
        email: normalized,
        name: args.name,
        passwordHash,
      }
    );

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await ctx.runMutation(internal.authQueries.storeOtp, {
      userId,
      otp,
    });

    // Schedule deletion of unverified provisional account after 30 minutes
    await ctx.scheduler.runAfter(
      30 * 60 * 1000,
      internal.authQueries.cleanupUnverifiedUser,
      { userId }
    );

    await ctx.scheduler.runAfter(0, internal.emails.sendEmailOtp, {
      to: normalized,
      code: otp,
      locale: args.locale,
    });

    return { success: true, userId };
  },
});

export const resendOtp = action({
  args: {
    userId: v.string(),
    email: v.string(),
    locale: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args): Promise<boolean> => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await ctx.runMutation(internal.authQueries.storeOtp, {
      userId: args.userId,
      otp,
    });

    await ctx.scheduler.runAfter(0, internal.emails.sendEmailOtp, {
      to: args.email.toLowerCase().trim(),
      code: otp,
      locale: args.locale,
    });
    return true;
  },
});

export const verifyOtp = action({
  args: {
    userId: v.string(),
    otp: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    sessionToken: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; sessionToken?: string; error?: string }> => {
    const valid: boolean = await ctx.runMutation(
      internal.authQueries.validateOtpAndConsume,
      {
        userId: args.userId,
        otp: args.otp,
      }
    );

    if (!valid) {
      return { success: false, error: "invalidOtp" };
    }

    const sessionToken = crypto.randomUUID();
    await ctx.runMutation(internal.authQueries.createSessionToken, {
      userId: args.userId,
      sessionToken,
    });

    return { success: true, sessionToken };
  },
});

export const requestPasswordReset = action({
  args: {
    email: v.string(),
    appUrl: v.string(),
    locale: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args): Promise<boolean> => {
    const normalized = args.email.toLowerCase().trim();
    const creds: any = await ctx.runQuery(
      internal.authQueries.getCredentialsByEmail,
      { email: normalized }
    );

    if (!creds) {
      return true;
    }

    const secret = crypto.randomUUID();
    await ctx.runMutation(internal.authQueries.storeResetToken, {
      userId: creds.userId,
      secret,
    });

    const resetUrl = `${args.appUrl}/reset-password/confirm?userId=${creds.userId}&secret=${secret}`;
    await ctx.scheduler.runAfter(0, internal.emails.sendPasswordResetEmail, {
      to: normalized,
      resetUrl,
      userName: creds.name,
      locale: args.locale,
    });

    return true;
  },
});

export const confirmPasswordReset = action({
  args: {
    userId: v.string(),
    secret: v.string(),
    newPassword: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; error?: string }> => {
    const valid: boolean = await ctx.runMutation(
      internal.authQueries.validateResetToken,
      {
        userId: args.userId,
        secret: args.secret,
      }
    );

    if (!valid) {
      return { success: false, error: "resetFailed" };
    }

    const newHash = hashPassword(args.newPassword);
    await ctx.runMutation(internal.authQueries.updatePasswordHash, {
      userId: args.userId,
      passwordHash: newHash,
    });

    return { success: true };
  },
});
