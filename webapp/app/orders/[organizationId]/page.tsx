import {
  getOrders,
  getOrganization,
  getOrderSessions,
} from "@/lib/convex/database";
import { getUser } from "@/lib/convex/auth";
import { LiveOrdersContent } from "@/components/dashboard/live-orders-content";
import { cookies } from "next/headers";
import { LocalizedText } from "@/components/ui/localized-text";

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

  const [organization, sessions, initialOrders, user] = await Promise.all([
    getOrganization(organizationId),
    getOrderSessions(organizationId),
    getOrders(organizationId),
    getUser(),
  ]);

  if (!organization) {
    return (
      <div className="p-8 text-center">
        <LocalizedText tKey="orgNotFound" />
      </div>
    );
  }

  // Allow if owner is logged in
  const isOwner = Boolean(user && (user._id === organization.ownerId || user.$id === organization.ownerId));

  // Verification via token or session cookie
  const tokenToVerify = token || cookieToken;
  const isValidSession = isOwner || Boolean(tokenToVerify && sessions.some((s) => s.token === tokenToVerify));

  if (!isValidSession) {
    if (!tokenToVerify && !isOwner) {
      return (
        <LocalizedText
          tKey="noToken"
          className="p-8 text-center text-destructive font-bold"
          as="div"
        />
      );
    }

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
