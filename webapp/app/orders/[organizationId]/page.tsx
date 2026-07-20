import { getOrders, getOrganization } from "@/lib/appwrite/database";
import { LiveOrdersContent } from "@/components/dashboard/live-orders-content";

export const metadata = { title: "Kitchen Board" };

export default async function KitchenBoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const [{ organizationId }] = await Promise.all([
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
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-primary text-primary-foreground px-6 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight">
          zakkig{" "}
          <span className="font-normal opacity-80 ml-2">
            Kitchen Board
          </span>
        </h1>
        <div className="font-medium">{organization.name}</div>
      </header>
      <main className="flex-1 overflow-y-auto p-6">
        <LiveOrdersContent
          organizationId={organizationId}
          orders={structuredClone(initialOrders)}
        />
      </main>
    </div>
  );
}
