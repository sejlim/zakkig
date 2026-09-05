import { getMenuCategories, getMenuItems } from "@/lib/convex/database";
import { MenuContent } from "@/components/dashboard/menu-content";

import { cookies } from "next/headers";
import { translations, Locale } from "@/lib/translations";

export async function generateMetadata() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "de";
  const dict = translations[locale] || translations.de;
  return {
    title: dict.menu,
  };
}

export default async function MenuPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const [categories, items] = await Promise.all([
    getMenuCategories(organizationId),
    getMenuItems(organizationId),
  ]);

  return (
    <MenuContent
      categories={structuredClone(categories)}
      items={structuredClone(items)}
      organizationId={organizationId}
    />
  );
}
