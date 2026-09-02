"use node";

import { action } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import Stripe from "stripe";

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY in Convex environment");
  return new Stripe(key, {
    apiVersion: "2024-06-20" as any,
  });
}

export const connectStripe = action({
  args: {
    organizationId: v.id("organizations"),
    origin: v.string(),
  },
  returns: v.object({
    url: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const org = await ctx.runQuery(api.organizations.get, { id: args.organizationId });
      if (!org) throw new Error("Organization not found");

      const stripe = getStripeClient();
      let accountId = org.stripeAccountId;

      if (!accountId) {
        const account = await stripe.accounts.create({
          type: "express",
          country: "DE",
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        });
        accountId = account.id;

        await ctx.runMutation(api.organizations.update, {
          id: args.organizationId,
          stripeAccountId: accountId,
        });
      }

      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${args.origin}/dashboard/${args.organizationId}/settings`,
        return_url: `${args.origin}/dashboard/${args.organizationId}/settings/stripe-return`,
        type: "account_onboarding",
      });

      return { url: accountLink.url };
    } catch (e: any) {
      console.error("connectStripe error:", e);
      return { error: e.message || "Failed to connect Stripe" };
    }
  },
});

export const getStripeAccountStatus = action({
  args: { organizationId: v.id("organizations") },
  returns: v.object({
    isConnected: v.boolean(),
    isOnboardingComplete: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (
    ctx,
    args
  ): Promise<{ isConnected: boolean; isOnboardingComplete: boolean; error?: string }> => {
    try {
      const org: any = await ctx.runQuery(api.organizations.get, { id: args.organizationId });
      if (!org || !org.stripeAccountId) {
        return { isConnected: false, isOnboardingComplete: false };
      }

      const stripe = getStripeClient();
      const account = await stripe.accounts.retrieve(org.stripeAccountId);

      const isComplete = Boolean(
        account.details_submitted ||
          account.charges_enabled ||
          account.capabilities?.transfers === "active" ||
          account.capabilities?.card_payments === "active"
      );

      if (isComplete !== org.stripeOnboardingComplete) {
        await ctx.runMutation(api.organizations.update, {
          id: args.organizationId,
          stripeOnboardingComplete: isComplete,
        });
      }

      return {
        isConnected: true,
        isOnboardingComplete: isComplete,
      };
    } catch (e: any) {
      console.error("getStripeAccountStatus error:", e);
      return { isConnected: false, isOnboardingComplete: false, error: e.message };
    }
  },
});

export const createStripeDashboardLink = action({
  args: {
    organizationId: v.id("organizations"),
    origin: v.string(),
  },
  returns: v.object({
    url: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (
    ctx,
    args
  ): Promise<{ url?: string; error?: string }> => {
    try {
      const org: any = await ctx.runQuery(api.organizations.get, { id: args.organizationId });
      if (!org || !org.stripeAccountId) throw new Error("No Stripe account connected");

      const stripe = getStripeClient();
      try {
        const loginLink = await stripe.accounts.createLoginLink(org.stripeAccountId);
        return { url: loginLink.url };
      } catch (loginErr: any) {
        console.warn("createLoginLink threw, fallback to account link:", loginErr?.message);
        const accountLink = await stripe.accountLinks.create({
          account: org.stripeAccountId,
          refresh_url: `${args.origin}/dashboard/${args.organizationId}/settings`,
          return_url: `${args.origin}/dashboard/${args.organizationId}/settings`,
          type: "account_onboarding",
        });
        return { url: accountLink.url };
      }
    } catch (e: any) {
      console.error("createStripeDashboardLink error:", e);
      return { error: e.message };
    }
  },
});

export const completeTestStripeOnboarding = action({
  args: { organizationId: v.id("organizations") },
  returns: v.object({
    success: v.boolean(),
    accountId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; accountId?: string; error?: string }> => {
    try {
      const org: any = await ctx.runQuery(api.organizations.get, { id: args.organizationId });
      if (!org) throw new Error("Organization not found");

      const stripe = getStripeClient();
      let accountId = org.stripeAccountId;
      if (!accountId || accountId === "acct_test_123") {
        const account = await stripe.accounts.create({
          type: "express",
          country: "DE",
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        });
        accountId = account.id;
      }

      const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_");
      if (isTestMode) {
        try {
          await stripe.accounts.createExternalAccount(accountId, {
            external_account: "btok_de_verified",
          });
        } catch {
          // ignore
        }
      }

      await ctx.runMutation(api.organizations.update, {
        id: args.organizationId,
        stripeAccountId: accountId,
        stripeOnboardingComplete: true,
      });

      return { success: true, accountId };
    } catch (e: any) {
      console.error("completeTestStripeOnboarding error:", e);
      return { success: false, error: e.message };
    }
  },
});

function packItemsIntoMetadata(items: string, metadata: Record<string, string>) {
  if (items.length <= 500) {
    metadata.items = items;
  } else {
    const chunkSize = 480;
    let chunkIndex = 0;
    for (let i = 0; i < items.length; i += chunkSize) {
      metadata[`items_${chunkIndex}`] = items.slice(i, i + chunkSize);
      chunkIndex++;
    }
  }
}

export function extractItemsFromMetadata(meta: Record<string, any>): string {
  if (meta.items) return meta.items;
  let itemsStr = "";
  let i = 0;
  while (meta[`items_${i}`]) {
    itemsStr += meta[`items_${i}`];
    i++;
  }
  return itemsStr || "[]";
}

export const createPaymentIntent = action({
  args: {
    organizationId: v.id("organizations"),
    type: v.union(v.literal("dine-in"), v.literal("takeaway")),
    tableNumber: v.optional(v.string()),
    items: v.string(), // JSON string
    total: v.number(), // in cents
    email: v.string(),
    currency: v.optional(v.string()),
  },
  returns: v.object({
    clientSecret: v.optional(v.string()),
    paymentIntentId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const org = await ctx.runQuery(api.organizations.get, { id: args.organizationId });
      if (!org) return { error: "Organization not found" };
      if (!org.stripeAccountId) return { error: "Restaurant is not connected to Stripe" };

      const stripe = getStripeClient();
      const curr = (args.currency || org.currency || "eur").toLowerCase();

      // Platform margin: 1%
      const platformMargin = Math.round(args.total * 0.01);
      const transferAmount = Math.round(args.total - platformMargin);

      const metadata: Record<string, string> = {
        organizationId: args.organizationId,
        tableNumber: args.tableNumber || "",
        type: args.type,
        email: args.email,
        total: String(Math.round(args.total)),
        currency: curr.toUpperCase(),
      };
      packItemsIntoMetadata(args.items, metadata);

      const paymentIntentParams: any = {
        amount: Math.round(args.total),
        currency: curr,
        automatic_payment_methods: { enabled: true },
        transfer_data: {
          destination: org.stripeAccountId,
          amount: transferAmount,
        },
        metadata,
      };

      let paymentIntent;
      try {
        paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
      } catch (err: any) {
        if (
          (err.code === "insufficient_capabilities_for_transfer" ||
            err.message?.includes("capabilities")) &&
          process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")
        ) {
          delete paymentIntentParams.transfer_data;
          paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
        } else {
          throw err;
        }
      }

      return {
        clientSecret: paymentIntent.client_secret ?? undefined,
        paymentIntentId: paymentIntent.id,
      };
    } catch (e: any) {
      console.error("createPaymentIntent error:", e);
      return { error: e.message || "Failed to create payment intent" };
    }
  },
});

export const verifyPaymentAndCreateOrder = action({
  args: { paymentIntentId: v.string() },
  returns: v.union(v.null(), v.id("orders")),
  handler: async (ctx, args): Promise<Id<"orders"> | null> => {
    try {
      const existing: any = await ctx.runQuery(api.orders.getOrderByPaymentIntent, {
        stripePaymentId: args.paymentIntentId,
      });
      if (existing) return existing._id;

      const stripe = getStripeClient();
      const pi = await stripe.paymentIntents.retrieve(args.paymentIntentId);
      if (pi.status !== "succeeded") {
        return null;
      }

      const meta = pi.metadata;
      if (!meta || !meta.organizationId) return null;

      const items = extractItemsFromMetadata(meta);

      const orderId = await ctx.runMutation(
        internal.orders.createPaidOrderFromWebhook,
        {
          organizationId: meta.organizationId as any,
          tableNumber: meta.tableNumber || undefined,
          type: (meta.type as any) || "takeaway",
          items,
          total: pi.amount,
          email: meta.email || pi.receipt_email || "",
          stripePaymentId: pi.id,
          currency: pi.currency.toUpperCase(),
        }
      );

      return orderId;
    } catch (e) {
      console.error("verifyPaymentAndCreateOrder error:", e);
      return null;
    }
  },
});
