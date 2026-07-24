import {
  getOrganization,
  getOrders,
  getAvailabilitySessions,
  getOrderSessions,
} from "@/lib/appwrite/database";
import { generateAvailabilitySessionAction } from "@/actions/availability-actions";
import { generateOrderSessionAction } from "@/actions/order-actions";
import { OverviewContent } from "@/components/dashboard/overview-content";
import { SessionsOverviewCard } from "@/components/dashboard/sessions-overview-card";
import { headers } from "next/headers";

export const metadata = { title: "Übersicht" };

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const [organization, orders, availabilitySessions, orderSessions] = await Promise.all([
    getOrganization(organizationId),
    getOrders(organizationId),
    getAvailabilitySessions(organizationId),
    getOrderSessions(organizationId),
  ]);

  if (!organization) return null;

  let availabilityToken = availabilitySessions[0]?.token;
  if (!availabilityToken) {
    const res = await generateAvailabilitySessionAction(organizationId);
    if (res.success && res.session) {
      availabilityToken = res.session.token;
    }
  }

  let orderToken = orderSessions[0]?.token;
  if (!orderToken) {
    const res = await generateOrderSessionAction(organizationId);
    if (res.success && res.session) {
      orderToken = res.session.token;
    }
  }

  const headersList = await headers();
  const host = headersList.get("host") || "";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  if (!organization) return null;

  return (
    <OverviewContent
      organization={structuredClone(organization)}
      orders={structuredClone(orders)}
    >
      {availabilityToken && orderToken && (
        <SessionsOverviewCard
          availabilityToken={availabilityToken}
          orderToken={orderToken}
          organizationId={organizationId}
          baseUrl={baseUrl}
        />
      )}
    </OverviewContent>
  );
}
