import { getOrders } from "@/lib/appwrite/database";
import { ArchiveContent } from "@/components/dashboard/archive-content";

export const metadata = { title: "Archiv" };

export default async function ArchivePage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const orders = await getOrders(organizationId);

  return <ArchiveContent orders={structuredClone(orders)} organizationId={organizationId} />;
}
