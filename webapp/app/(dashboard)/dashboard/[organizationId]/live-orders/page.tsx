import { getOrders, getKitchenSessions, getOrganization } from "@/lib/appwrite/database";
import { LiveOrdersContent } from "@/components/dashboard/live-orders-content";

export const metadata = { title: "Live-Bestellungen" };

export default async function LiveOrdersPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const [orders, sessions, organization] = await Promise.all([
    getOrders(organizationId),
    getKitchenSessions(organizationId),
    getOrganization(organizationId),
  ]);

  if (!organization) return null;

  return (
    <LiveOrdersContent 
      orders={orders} 
      organizationId={organizationId}
      kitchenSessions={sessions}
      organization={organization}
    />
  );
}
