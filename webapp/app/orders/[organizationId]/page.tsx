import {
  getOrders,
  getOrganization,
  getOrderSessions,
} from "@/lib/appwrite/database";
import { LiveOrdersContent } from "@/components/dashboard/live-orders-content";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LocalizedText } from "@/components/ui/localized-text";

import { SessionPoller } from "@/components/session-poller";

export const metadata = { title: "Kitchen Board" };

export default async function KitchenBoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const [{ organizationId }, { token }] = await Promise.all([params, searchParams]);
  const cookieStore = await cookies();
  const cookieName = `order_session_${organizationId}`;
  const cookieToken = cookieStore.get(cookieName)?.value;

  const [organization, sessions, initialOrders] = await Promise.all([
    getOrganization(organizationId),
    getOrderSessions(organizationId),
    getOrders(organizationId),
  ]);

  if (!organization) {
    return (
      <div className="p-8 text-center">
        <LocalizedText tKey="orgNotFound" />
      </div>
    );
  }

  // Verification
  const tokenToVerify = token || cookieToken;

  if (!tokenToVerify) {
    return (
      <LocalizedText
        tKey="noToken"
        className="p-8 text-center text-destructive font-bold"
        as="div"
      />
    );
  }

  const isValidSession = sessions.some((s) => s.token === tokenToVerify);

  if (!isValidSession) {
    return (
      <LocalizedText
        tKey="invalidToken"
        className="p-8 text-center text-destructive font-bold"
        as="div"
      />
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <SessionPoller organizationId={organizationId} type="orders" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <LiveOrdersContent
          organizationId={organizationId}
          orders={structuredClone(initialOrders)}
          isStaffView={true}
        />
      </main>
    </div>
  );
}
