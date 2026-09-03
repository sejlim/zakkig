import {
  getOrganization,
  getMenuCategories,
  getAvailableMenuItems,
} from "@/lib/convex/database";
import { GuestFrontend } from "@/components/guest/guest-frontend";
import { Storefront } from "@phosphor-icons/react/dist/ssr";
import { LocalizedText } from "@/components/ui/localized-text";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ table?: string }>;
}) {
  const { table } = await searchParams;
  return {
    title: table ? `Bestellen an Tisch ${table}` : "Bestellen an Tisch",
  };
}

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
    return (
      <div className="p-8 text-center">
        <LocalizedText tKey="orgNotFound" />
      </div>
    );

  if (organization.isToStayEnabled === false) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-background text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
          <Storefront
            className="w-8 h-8 text-muted-foreground"
            weight="duotone"
          />
        </div>
        <h1 className="text-2xl font-bold mb-2">
          <LocalizedText tKey="ordersPaused" />
        </h1>
        <LocalizedText
          tKey="notAcceptingOrders"
          params={{ name: organization.name }}
          className="text-muted-foreground max-w-sm"
          as="p"
        />
      </div>
    );
  }

  if (!organization.stripeOnboardingComplete) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-background text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
          <Storefront
            className="w-8 h-8 text-muted-foreground"
            weight="duotone"
          />
        </div>
        <h1 className="text-2xl font-bold mb-2">
          <LocalizedText tKey="onlineOrderingUnavailable" />
        </h1>
        <LocalizedText
          tKey="onlineOrderingUnavailableDesc"
          className="text-muted-foreground max-w-sm"
          as="p"
        />
      </div>
    );
  }

  const publicOrganization = {
    ...organization,
    stripeAccountId: undefined,
    taxId: undefined,
    ownerId: "",
  };

  return (
    <GuestFrontend
      organization={structuredClone(publicOrganization)}
      categories={structuredClone(categories)}
      items={structuredClone(items)}
      type="dine-in"
      tableNumber={table}
    />
  );
}
