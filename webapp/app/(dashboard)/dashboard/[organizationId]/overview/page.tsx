import {
  getOrganization,
  getOrders,
} from "@/lib/appwrite/database";
import { OverviewContent } from "@/components/dashboard/overview-content";

export const metadata = { title: "Übersicht" };

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const [organization, orders] = await Promise.all([
    getOrganization(organizationId),
    getOrders(organizationId),
  ]);

  if (!organization) return null;

  return (
    <OverviewContent
      organization={structuredClone(organization)}
      orders={structuredClone(orders)}
    />
  );
}
