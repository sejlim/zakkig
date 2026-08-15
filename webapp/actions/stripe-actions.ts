"use server";

import { headers } from "next/headers";
import { getOrganization } from "@/lib/appwrite/database";
import { createAdminClient } from "@/lib/appwrite/server";
import { DATABASE_ID } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as any,
});

export async function connectStripeAction(organizationId: string) {
  try {
    const org = await getOrganization(organizationId);
    if (!org) throw new Error("Organization not found");

    const headerList = await headers();
    const origin = headerList.get("origin") || "http://localhost:3001";
    
    let accountId = org.stripeAccountId;

    // 1. Create a Stripe account if it doesn't exist
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

      // Save to database
      const { tablesDB } = createAdminClient();
      await tablesDB.updateDocument(
        DATABASE_ID,
        "organizations",
        organizationId,
        { stripeAccountId: accountId }
      );
    }

    // 2. Create an Account Link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/dashboard/${organizationId}/settings`,
      return_url: `${origin}/dashboard/${organizationId}/settings/stripe-return`,
      type: "account_onboarding",
    });

    return { url: accountLink.url };
  } catch (error: any) {
    console.error("connectStripeAction error:", error);
    return { error: error.message };
  }
}

export async function getStripeAccountStatusAction(organizationId: string) {
  try {
    const org = await getOrganization(organizationId);
    if (!org || !org.stripeAccountId) {
      return { isConnected: false, isOnboardingComplete: false };
    }

    const account = await stripe.accounts.retrieve(org.stripeAccountId);
    
    // An account is fully usable when details are submitted, charges enabled or transfers active
    const isComplete = Boolean(
      account.details_submitted ||
      account.charges_enabled ||
      account.capabilities?.transfers === "active" ||
      account.capabilities?.card_payments === "active"
    );

    // Update DB if status changed
    if (isComplete !== org.stripeOnboardingComplete) {
      const { tablesDB } = createAdminClient();
      await tablesDB.updateDocument(
        DATABASE_ID,
        "organizations",
        organizationId,
        { stripeOnboardingComplete: isComplete }
      );
      revalidatePath(`/dashboard/${organizationId}/settings`);
    }

    return { 
      isConnected: true, 
      isOnboardingComplete: isComplete 
    };
  } catch (error: any) {
    console.error("getStripeAccountStatusAction error:", error);
    return { error: error.message };
  }
}

export async function createStripeDashboardLinkAction(organizationId: string) {
  try {
    const org = await getOrganization(organizationId);
    if (!org || !org.stripeAccountId) throw new Error("No Stripe account connected");

    const headerList = await headers();
    const origin = headerList.get("origin") || "http://localhost:3001";

    try {
      const loginLink = await stripe.accounts.createLoginLink(org.stripeAccountId);
      return { url: loginLink.url };
    } catch (loginErr: any) {
      console.warn("createLoginLink threw, fallback to account link:", loginErr?.message);
      const accountLink = await stripe.accountLinks.create({
        account: org.stripeAccountId,
        refresh_url: `${origin}/dashboard/${organizationId}/settings`,
        return_url: `${origin}/dashboard/${organizationId}/settings`,
        type: "account_onboarding",
      });
      return { url: accountLink.url };
    }
  } catch (error: any) {
    console.error("createStripeDashboardLinkAction error:", error);
    return { error: error.message };
  }
}

export async function completeTestStripeOnboardingAction(organizationId: string) {
  try {
    const org = await getOrganization(organizationId);
    if (!org) throw new Error("Organization not found");

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
    }

    const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_");
    if (isTestMode) {
      try {
        await stripe.accounts.createExternalAccount(accountId, {
          external_account: "btok_de_verified",
        });
      } catch (e) {
        // may already have an external account
      }
    }

    const { tablesDB } = createAdminClient();
    await tablesDB.updateDocument(
      DATABASE_ID,
      "organizations",
      organizationId,
      {
        stripeAccountId: accountId,
        stripeOnboardingComplete: true,
      }
    );

    revalidatePath(`/dashboard/${organizationId}/settings`);
    return { success: true, accountId };
  } catch (error: any) {
    console.error("completeTestStripeOnboardingAction error:", error);
    return { error: error.message };
  }
}
