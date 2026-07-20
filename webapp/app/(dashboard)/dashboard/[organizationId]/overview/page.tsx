import {
  getOrganization,
  getOrders,
  getKitchenSessions,
} from "@/lib/appwrite/database";
import { OverviewContent } from "@/components/dashboard/overview-content";

export const metadata = { title: "Übersicht" };

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const [organization, orders, sessions] = await Promise.all([
    getOrganization(organizationId),
    getOrders(organizationId),
    getKitchenSessions(organizationId),
  ]);

  if (!organization) return null;

  return (
    <OverviewContent
      organization={structuredClone(organization)}
      orders={structuredClone(orders)}
      kitchenSessions={structuredClone(sessions)}
    />
  );
}
