import {
  getOrganization,
  getOrders,
  getAvailabilitySessions,
  getOrderSessions,
  createAvailabilitySession,
  createOrderSession,
} from "@/lib/appwrite/database";
import { getUser } from "@/lib/appwrite/server";
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
  const [organization, orders, availabilitySessions, orderSessions] =
    await Promise.all([
      getOrganization(organizationId),
      getOrders(organizationId),
      getAvailabilitySessions(organizationId),
      getOrderSessions(organizationId),
    ]);

  if (!organization) return null;

  const availabilityToken = availabilitySessions[0]?.token;
  const orderToken = orderSessions[0]?.token;

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
