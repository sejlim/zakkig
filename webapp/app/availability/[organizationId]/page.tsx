import {
  getMenuCategories,
  getMenuItems,
  getOrganization,
  getAvailabilitySessions,
} from "@/lib/appwrite/database";
import { AvailabilityContent } from "@/components/availability/availability-content";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = { title: "Verfügbarkeit" };

export default async function AvailabilityPage({
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
  const cookieName = `availability_session_${organizationId}`;
  const cookieToken = cookieStore.get(cookieName)?.value;

  const [organization, sessions, categories, items] = await Promise.all([
    getOrganization(organizationId),
    getAvailabilitySessions(organizationId),
    getMenuCategories(organizationId),
    getMenuItems(organizationId),
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
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-primary text-primary-foreground px-4 sm:px-6 shadow-sm sticky top-0 z-10">
        <h1 className="text-xl font-bold tracking-tight truncate">
          zakkig{" "}
          <span className="font-normal opacity-80 ml-1 sm:ml-2 text-sm sm:text-base">
            Verfügbarkeit
          </span>
        </h1>
        <div className="font-medium text-sm sm:text-base truncate max-w-[150px] sm:max-w-xs text-right">
          {organization.name}
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <AvailabilityContent
          categories={categories}
          items={items}
        />
      </main>
    </div>
  );
}
