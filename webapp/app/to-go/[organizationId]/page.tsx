import {
  getOrganization,
  getMenuCategories,
  getAvailableMenuItems,
  getOrder,
} from "@/lib/appwrite/database";
import { GuestFrontend } from "@/components/guest/guest-frontend";
import { Storefront } from "@phosphor-icons/react/dist/ssr";

export const metadata = { title: "Bestellen | To-Go" };

export default async function ToGoPage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const [{ organizationId }, { order }] = await Promise.all([
    params,
    searchParams,
  ]);

  const [organization, categories, items, initialOrder] = await Promise.all([
    getOrganization(organizationId),
    getMenuCategories(organizationId),
    getAvailableMenuItems(organizationId),
    order ? getOrder(order) : Promise.resolve(null),
  ]);

  if (!organization)
    return <div className="p-8 text-center">Organization not found</div>;

  if (organization.isToGoEnabled === false && !order) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-background text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
          <Storefront
            className="w-8 h-8 text-muted-foreground"
            weight="duotone"
          />
        </div>
        <h1 className="text-2xl font-bold mb-2">Abholung pausiert</h1>
        <p className="text-muted-foreground max-w-sm">
          {organization.name} nimmt momentan keine To-Go Bestellungen an. Bitte
          versuche es später noch einmal.
        </p>
      </div>
    );
  }

  return (
    <GuestFrontend
      organization={structuredClone(organization)}
      categories={structuredClone(categories)}
      items={structuredClone(items)}
      type="takeaway"
      orderId={order}
      initialOrder={initialOrder ? structuredClone(initialOrder) : null}
    />
  );
}
