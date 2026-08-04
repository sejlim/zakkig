"use server";

import { createAdminClient } from "@/lib/appwrite/server";
import { Functions, ExecutionMethod, Query } from "node-appwrite";

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
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID_WEBAPP!,
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
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID_WEBAPP!,
      "orders",
      [
        Query.equal("stripePaymentId", paymentIntentId)
      ]
    );

    if (documents.length > 0) {
      return { order: documents[0] };
    }
    return { order: null };
  } catch (error: any) {
    console.error("getOrderByPaymentIntentAction failed:", error);
    return { error: error.message };
  }
}
