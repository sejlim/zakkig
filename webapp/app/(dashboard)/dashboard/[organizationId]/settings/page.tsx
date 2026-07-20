import { getOrganization } from "@/lib/appwrite/database";
import { getUser } from "@/lib/appwrite/server";
import { SettingsContent } from "@/components/dashboard/settings-content";

export const metadata = { title: "Einstellungen" };

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
