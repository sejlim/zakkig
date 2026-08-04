import { getStripeAccountStatusAction } from "@/actions/stripe-actions";
import { redirect } from "next/navigation";
import { LocalizedText } from "@/components/ui/localized-text";
import { SpinnerGap } from "@phosphor-icons/react/dist/ssr";

export default async function StripeReturnPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;

  // Wait a moment for Stripe webhooks to potentially process, though we pull status synchronously
  const status = await getStripeAccountStatusAction(organizationId);

  // Redirect back to settings page
  redirect(`/dashboard/${organizationId}/settings`);

  // Fallback UI if redirect is delayed
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <SpinnerGap className="w-8 h-8 animate-spin text-primary" />
      <p className="text-muted-foreground">
        <LocalizedText tKey="verifying" />
      </p>
    </div>
  );
}
