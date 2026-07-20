import {
  getOrganization,
  getMenuCategories,
  getAvailableMenuItems,
} from "@/lib/appwrite/database";
import { GuestFrontend } from "@/components/guest/guest-frontend";
import { Storefront } from "@phosphor-icons/react/dist/ssr";

export const metadata = { title: "Bestellen | Vor Ort" };

export default async function ToStayPage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ table?: string }>;
}) {
  const [{ organizationId }, { table }] = await Promise.all([
    params,
    searchParams,
  ]);

  const [organization, categories, items] = await Promise.all([
    getOrganization(organizationId),
    getMenuCategories(organizationId),
    getAvailableMenuItems(organizationId),
  ]);

  if (!organization)
    return <div className="p-8 text-center">Organization not found</div>;

  if (organization.isToStayEnabled === false) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-background text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
          <Storefront
            className="w-8 h-8 text-muted-foreground"
            weight="duotone"
          />
        </div>
        <h1 className="text-2xl font-bold mb-2">Bestellungen pausiert</h1>
        <p className="text-muted-foreground max-w-sm">
          {organization.name} nimmt momentan keine Tisch-Bestellungen über das
          Handy an. Bitte wende dich an unser Personal.
        </p>
      </div>
    );
  }

  return (
    <GuestFrontend
      organization={structuredClone(organization)}
      categories={structuredClone(categories)}
      items={structuredClone(items)}
      type="dine-in"
      tableNumber={table}
    />
  );
}
