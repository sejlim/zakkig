import { getOrganization } from "@/lib/convex/database";
import { getUser } from "@/lib/convex/auth";
import { SettingsContent } from "@/components/dashboard/settings-content";

import { cookies } from "next/headers";
import { translations, Locale } from "@/lib/translations";

export async function generateMetadata() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "de";
  const dict = translations[locale] || translations.de;
  return {
    title: dict.settings,
  };
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const [organization, user] = await Promise.all([
    getOrganization(organizationId),
    getUser(),
  ]);

  if (!organization || !user) return null;

  return (
    <SettingsContent
      organization={structuredClone(organization)}
      user={structuredClone(user)}
    />
  );
}
