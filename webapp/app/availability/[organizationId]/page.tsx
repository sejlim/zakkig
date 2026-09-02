import {
  getMenuCategories,
  getMenuItems,
  getOrganization,
  getAvailabilitySessions,
} from "@/lib/convex/database";
import { getUser } from "@/lib/convex/auth";
import { AvailabilityContent } from "@/components/availability/availability-content";
import { cookies } from "next/headers";
import { LocalizedText } from "@/components/ui/localized-text";

export const metadata = { title: "Verfügbarkeit" };

export default async function AvailabilityPage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const [{ organizationId }, { token }] = await Promise.all([params, searchParams]);
  const cookieStore = await cookies();
  const cookieName = `availability_session_${organizationId}`;
  const cookieToken = cookieStore.get(cookieName)?.value;

  const [organization, sessions, categories, items, user] = await Promise.all([
    getOrganization(organizationId),
    getAvailabilitySessions(organizationId),
    getMenuCategories(organizationId),
    getMenuItems(organizationId),
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
  const isOwner = Boolean(user && user._id === organization.ownerId);

  // Verification via query token or session cookie
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
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <AvailabilityContent
          categories={structuredClone(categories)}
          items={structuredClone(items)}
          organizationId={organizationId}
        />
      </main>
    </div>
  );
}
