import { redirect } from "next/navigation";
import { getUser } from "@/lib/convex/auth";
import { getOrganizationByOwner } from "@/lib/convex/database";

export default async function DashboardRootPage() {
  const user = await getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const userId = user.$id ?? user._id;
  const org = await getOrganizationByOwner(userId);

  if (org) {
    redirect(`/dashboard/${org.$id}/overview`);
  }

  redirect("/dashboard/new/overview");
}
