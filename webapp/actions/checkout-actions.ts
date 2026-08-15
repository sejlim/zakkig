"use server";

import { createAdminClient } from "@/lib/appwrite/server";
import { DATABASE_ID } from "@/lib/constants";
import { Functions, ExecutionMethod, Query, ID, Permission, Role } from "node-appwrite";
import Stripe from "stripe";

interface CreatePaymentIntentParams {
  organizationId: string;
  type: string;
  tableNumber?: string;
  items: any[];
  total: number;
  email: string;
}

export async function createPaymentIntentAction(params: CreatePaymentIntentParams) {
  try {
    const { client, tablesDB: databases } = await createAdminClient();
    const functions = new Functions(client);

    // Fetch the organization here to avoid Appwrite Cloud function loopback fetch issues
    const org = await databases.getDocument(
      DATABASE_ID,
      'organizations',
      params.organizationId
    );
    
    if (!org.stripeAccountId) {
      return { error: 'Restaurant is not connected to Stripe' };
    }

    const functionParams = {
      ...params,
      stripeAccountId: org.stripeAccountId
    };

    const result = await functions.createExecution(
      "create-payment-intent",
      JSON.stringify(functionParams),
      false, // async
      "/", // path
      ExecutionMethod.POST // method
    );

    const response = JSON.parse(result.responseBody);
    
    if (response.error) {
      return { error: response.error };
    }

    return { 
      clientSecret: response.clientSecret,
      paymentIntentId: response.paymentIntentId 
    };
  } catch (error: any) {
    console.error("createPaymentIntentAction failed:", error);
    return { error: error.message || "Failed to create payment intent" };
  }
}

export async function getOrderByPaymentIntentAction(paymentIntentId: string) {
  try {
    const { tablesDB: databases } = await createAdminClient();
    const { documents } = await databases.listDocuments(
      DATABASE_ID,
      "orders",
      [
        Query.equal("stripePaymentId", paymentIntentId)
      ]
    );

    if (documents.length > 0) {
      return { order: documents[0] };
    }

    // Fallback: If webhook hasn't processed yet or is delayed, verify with Stripe directly
    if (process.env.STRIPE_SECRET_KEY && paymentIntentId) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      let paymentIntent: Stripe.PaymentIntent | null = null;

      try {
        paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      } catch {
        // If created on a connected account, search through connected organizations
        const { documents: orgs } = await databases.listDocuments(DATABASE_ID, "organizations");
        for (const org of orgs) {
          if (org.stripeAccountId) {
            try {
              const pi = await stripe.paymentIntents.retrieve(
                paymentIntentId,
                {},
                { stripeAccount: org.stripeAccountId }
              );
              if (pi) {
                paymentIntent = pi;
                break;
              }
            } catch {}
          }
        }
      }

      if (paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")) {
        // Double check to prevent duplicate order creation
        const { documents: recheck } = await databases.listDocuments(
          DATABASE_ID,
          "orders",
          [Query.equal("stripePaymentId", paymentIntentId)]
        );
        if (recheck.length > 0) {
          return { order: recheck[0] };
        }

        const metadata = paymentIntent.metadata || {};
        const organizationId = metadata.organizationId;

        if (organizationId) {
          const total = parseInt(metadata.total || String(paymentIntent.amount), 10);
          const zakkigFee = Math.round(total * 0.01);

          // Generate rolling 3-digit order number (001-999)
          let nextNum = 1;
          try {
            const lastOrdersResult = await databases.listDocuments(
              DATABASE_ID,
              "orders",
              [
                Query.equal("organizationId", organizationId),
                Query.orderDesc("$createdAt"),
                Query.limit(1),
              ]
            );

            if (lastOrdersResult.documents.length > 0) {
              const lastNumStr = lastOrdersResult.documents[0].orderNumber;
              const lastNum = parseInt(lastNumStr, 10);
              if (!isNaN(lastNum) && lastNum >= 1) {
                nextNum = (lastNum % 999) + 1;
              }
            }
          } catch (error) {
            console.error("Failed to fetch last order number, defaulting to 001", error);
          }

          const orderNumber = String(nextNum).padStart(3, "0");

          const orderDoc = await databases.createDocument(
            DATABASE_ID,
            "orders",
            ID.unique(),
            {
              organizationId,
              tableNumber: metadata.tableNumber || "",
              type: metadata.type || "dine-in",
              items: metadata.items || "[]",
              total,
              status: "in_progress",
              email: metadata.email || "",
              orderNumber,
              stripePaymentId: paymentIntent.id,
              currency: metadata.currency || "EUR",
              zakkigFee,
              stripeFee: 0,
              netAmount: total - zakkigFee,
            },
            [Permission.read(Role.any()), Permission.update(Role.any())]
          );
          return { order: orderDoc };
        }
      }
    }

    return { order: null };
  } catch (error: any) {
    console.error("getOrderByPaymentIntentAction failed:", error);
    return { error: error.message, order: null };
  }
}
