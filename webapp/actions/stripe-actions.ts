"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { convexServer } from "@/lib/convex/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { requireOwner } from "@/lib/convex/auth";

export async function connectStripeAction(organizationId: string) {
  try {
    await requireOwner(organizationId);

    const headerList = await headers();
    const origin = headerList.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const res = await convexServer.action(api.stripe.connectStripe, {
      organizationId: organizationId as Id<"organizations">,
      origin,
    });

    if (res.error) return { error: res.error };
    return { url: res.url };
  } catch (error: any) {
    console.error("connectStripeAction error:", error);
    return { error: error.message || "Failed to connect Stripe" };
  }
}

export async function getStripeAccountStatusAction(organizationId: string) {
  try {
    await requireOwner(organizationId);

    const res = await convexServer.action(api.stripe.getStripeAccountStatus, {
      organizationId: organizationId as Id<"organizations">,
    });

    if (res.error) return { error: res.error };
    revalidatePath(`/dashboard/${organizationId}/settings`);

    return {
      isConnected: res.isConnected,
      isOnboardingComplete: res.isOnboardingComplete,
    };
  } catch (error: any) {
    console.error("getStripeAccountStatusAction error:", error);
    return { error: error.message };
  }
}

export async function createStripeDashboardLinkAction(organizationId: string) {
  try {
    await requireOwner(organizationId);

    const headerList = await headers();
    const origin = headerList.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const res = await convexServer.action(api.stripe.createStripeDashboardLink, {
      organizationId: organizationId as Id<"organizations">,
      origin,
    });

    if (res.error) return { error: res.error };
    return { url: res.url };
  } catch (error: any) {
    console.error("createStripeDashboardLinkAction error:", error);
    return { error: error.message };
  }
}

export async function completeTestStripeOnboardingAction(organizationId: string) {
  try {
    await requireOwner(organizationId);

    const res = await convexServer.action(api.stripe.completeTestStripeOnboarding, {
      organizationId: organizationId as Id<"organizations">,
    });

    if (res.error) return { error: res.error };
    revalidatePath(`/dashboard/${organizationId}/settings`);
    return { success: res.success, accountId: res.accountId };
  } catch (error: any) {
    console.error("completeTestStripeOnboardingAction error:", error);
    return { error: error.message };
  }
}
