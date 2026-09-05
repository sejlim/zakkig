import { getOrders } from "@/lib/convex/database";
import { ArchiveContent } from "@/components/dashboard/archive-content";

import { cookies } from "next/headers";
import { translations, Locale } from "@/lib/translations";

export async function generateMetadata() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "de";
  const dict = translations[locale] || translations.de;
  return {
    title: dict.archive,
  };
}

export default async function ArchivePage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const orders = await getOrders(organizationId);

  return (
    <ArchiveContent
      orders={structuredClone(orders)}
      organizationId={organizationId}
    />
  );
}
