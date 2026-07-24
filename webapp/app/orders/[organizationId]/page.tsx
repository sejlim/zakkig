import { getOrders, getOrganization, getOrderSessions } from "@/lib/appwrite/database";
import { LiveOrdersContent } from "@/components/dashboard/live-orders-content";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = { title: "Live-Bestellungen" };

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
  const cookieStore = await cookies();
  const cookieName = `order_session_${organizationId}`;
  const cookieToken = cookieStore.get(cookieName)?.value;

  const [organization, sessions, initialOrders] = await Promise.all([
    getOrganization(organizationId),
    getOrderSessions(organizationId),
    getOrders(organizationId),
  ]);

  if (!organization) {
    return <div className="p-8 text-center">Organisation nicht gefunden.</div>;
  }

  // Verification
  const tokenToVerify = cookieToken;

  if (!tokenToVerify) {
    return <div className="p-8 text-center text-destructive font-bold">Kein Token angegeben. Zugriff verweigert.</div>;
  }

  const isValidSession = sessions.some((s) => s.token === tokenToVerify);
  
  if (!isValidSession) {
    return <div className="p-8 text-center text-destructive font-bold">Ungültiger oder abgelaufener Token.</div>;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-primary text-primary-foreground px-6 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight">
          zakkig{" "}
          <span className="font-normal opacity-80 ml-2">
            Live-Bestellungen
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
