import { redirect } from "next/navigation";
import { getUser } from "@/lib/appwrite/server";
import { getOrganizationByOwner } from "@/lib/appwrite/database";

export default async function HomePage() {
  const user = await getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const org = await getOrganizationByOwner(user.$id);
  if (org) {
    redirect(`/dashboard/${org.$id}/overview`);
  }

  redirect("/sign-in");
}
