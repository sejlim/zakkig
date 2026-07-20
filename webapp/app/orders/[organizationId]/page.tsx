import { getOrders, getOrganization } from "@/lib/appwrite/database";
import { KitchenBoard } from "@/components/kitchen/kitchen-board";

export const metadata = { title: "Kitchen Board" };

export default async function KitchenBoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const [{ organizationId }, { token }] = await Promise.all([
    params,
    searchParams,
  ]);

  // In a real app we'd validate the token against kitchen_sessions
  // For now, we'll just load the data.
  const [organization, initialOrders] = await Promise.all([
    getOrganization(organizationId),
    getOrders(organizationId),
  ]);

  if (!organization)
    return <div className="p-8 text-center">Organization not found</div>;

  return (
    <KitchenBoard
      organization={structuredClone(organization)}
      initialOrders={structuredClone(initialOrders)}
    />
  );
}
