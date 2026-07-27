import {
  getMenuCategories,
  getMenuItems,
  getOrganization,
  getAvailabilitySessions,
} from "@/lib/appwrite/database";
import { AvailabilityContent } from "@/components/availability/availability-content";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LocalizedText } from "@/components/ui/localized-text";

export const metadata = { title: "Verfügbarkeit" };

export default async function AvailabilityPage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const [{ organizationId }] = await Promise.all([params, searchParams]);
  const cookieStore = await cookies();
  const cookieName = `availability_session_${organizationId}`;
  const cookieToken = cookieStore.get(cookieName)?.value;

  const [organization, sessions, categories, items] = await Promise.all([
    getOrganization(organizationId),
    getAvailabilitySessions(organizationId),
    getMenuCategories(organizationId),
    getMenuItems(organizationId),
  ]);

  if (!organization) {
    return (
      <div className="p-8 text-center">
        <LocalizedText tKey="orgNotFound" />
      </div>
    );
  }

  // Verification
  const tokenToVerify = cookieToken;

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
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <AvailabilityContent
          categories={categories}
          items={items}
          organizationId={organizationId}
        />
      </main>
    </div>
  );
}
