import { redirect } from "next/navigation";
import { getUser } from "@/lib/convex/auth";
import { getOrganization } from "@/lib/convex/database";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ organizationId: string }>;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { organizationId } = await params;
  let organization = null;

  if (organizationId !== "new") {
    organization = await getOrganization(organizationId);

    if (!organization) {
      redirect("/sign-in");
    }

    // Verify ownership
    if (organization.ownerId !== user.$id && organization.ownerId !== user._id) {
      redirect("/sign-in");
    }
  }

  return (
    <DashboardShell
      organization={organization ? structuredClone(organization) : null}
      user={structuredClone(user)}
    >
      {children}
    </DashboardShell>
  );
}
