import { httpRouter } from "convex/server";
import { components, internal } from "./_generated/api";
import { registerRoutes } from "@convex-dev/stripe";
import { auth } from "./auth";
import type Stripe from "stripe";

const http = httpRouter();

auth.addHttpRoutes(http);

function extractItemsFromMetadata(meta: Record<string, any>): string {
  if (meta.items) return meta.items;
  let itemsStr = "";
  let i = 0;
  while (meta[`items_${i}`]) {
    itemsStr += meta[`items_${i}`];
    i++;
  }
  return itemsStr || "[]";
}

registerRoutes(http, components.stripe, {
  webhookPath: "/stripe/webhook",
  events: {
    "payment_intent.succeeded": async (ctx, event: Stripe.PaymentIntentSucceededEvent) => {
      const paymentIntent = event.data.object;
      const metadata = paymentIntent.metadata || {};
      const organizationId = metadata.organizationId as any;
      if (organizationId) {
        const total = parseInt(metadata.total || String(paymentIntent.amount), 10);
        const currency = metadata.currency || paymentIntent.currency.toUpperCase();
        const items = extractItemsFromMetadata(metadata);

        await ctx.runMutation(internal.orders.createPaidOrderFromWebhook, {
          organizationId,
          tableNumber: metadata.tableNumber || undefined,
          type: (metadata.type as any) || "dine-in",
          items,
          total,
          email: metadata.email || "",
          stripePaymentId: paymentIntent.id,
          currency,
        });
      }
    },
  },
});

export default http;
