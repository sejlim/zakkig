import { getOrders } from "@/lib/appwrite/database";
import { OrdersContent } from "@/components/dashboard/orders-content";

export const metadata = { title: "Bestellungen" };

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const orders = await getOrders(organizationId);

  return <OrdersContent orders={orders} organizationId={organizationId} />;
}
