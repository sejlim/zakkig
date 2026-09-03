"use server";

import { convexServer } from "@/lib/convex/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Stripe from "stripe";

interface CreatePaymentIntentParams {
  organizationId: string;
  type: "dine-in" | "takeaway";
  tableNumber?: string;
  items: any[];
  total: number;
  email: string;
}

export async function createPaymentIntentAction(params: CreatePaymentIntentParams) {
  if (!params.organizationId) {
    return { error: "Betriebs-ID fehlt." };
  }
  if (!params.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(params.email.trim()) || params.email.length > 100) {
    return { error: "Ungültige E-Mail-Adresse." };
  }
  if (!params.total || params.total <= 0 || params.total > 1000000) {
    return { error: "Ungültiger Gesamtbetrag." };
  }
  if (params.tableNumber && params.tableNumber.length > 20) {
    return { error: "Die Tischnummer darf maximal 20 Zeichen lang sein." };
  }

  try {
    const res = await convexServer.action(api.stripe.createPaymentIntent, {
      organizationId: params.organizationId as Id<"organizations">,
      type: params.type,
      tableNumber: params.tableNumber,
      items: JSON.stringify(params.items),
      total: params.total,
      email: params.email,
    });

    if (res.error) {
      return { error: res.error };
    }

    return {
      clientSecret: res.clientSecret,
      paymentIntentId: res.paymentIntentId,
    };
  } catch (error: any) {
    console.error("createPaymentIntentAction failed:", error);
    return { error: error.message || "Failed to create payment intent" };
  }
}

export async function getOrderByPaymentIntentAction(paymentIntentId: string) {
  try {
    const doc = await convexServer.query(api.orders.getOrderByPaymentIntent, {
      stripePaymentId: paymentIntentId,
    });

    if (doc) {
      return {
        order: {
          ...doc,
          $id: doc._id,
          $createdAt: new Date(doc._creationTime).toISOString(),
        },
      };
    }

    // Fallback: If webhook hasn't fired yet, verify with Stripe directly
    if (process.env.STRIPE_SECRET_KEY && paymentIntentId) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")) {
        const metadata = paymentIntent.metadata || {};
        const organizationId = metadata.organizationId as any;

        if (organizationId) {
          const total = parseInt(metadata.total || String(paymentIntent.amount), 10);
          const currency = metadata.currency || paymentIntent.currency.toUpperCase();

          const newOrderRes = await convexServer.mutation(api.orders.createOrder, {
            organizationId,
            tableNumber: metadata.tableNumber || undefined,
            type: (metadata.type as any) || "dine-in",
            items: metadata.items || "[]",
            total,
            email: metadata.email || "",
            stripePaymentId: paymentIntent.id,
            zakkigFee: Math.round(total * 0.01),
            stripeFee: 0,
            netAmount: total - Math.round(total * 0.01),
            currency,
          });

          const created = await convexServer.query(api.orders.getOrder, { id: newOrderRes._id });
          if (created) {
            return {
              order: {
                ...created,
                $id: created._id,
                $createdAt: new Date(created._creationTime).toISOString(),
              },
            };
          }
        }
      }
    }

    return { order: null };
  } catch (error: any) {
    console.error("getOrderByPaymentIntentAction failed:", error);
    return { error: error.message, order: null };
  }
}
