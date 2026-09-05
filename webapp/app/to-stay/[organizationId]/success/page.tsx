import { PaymentSuccessPoller } from "@/components/guest/payment-success-poller";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { translations, Locale } from "@/lib/translations";

export async function generateMetadata() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "de";
  const dict = translations[locale] || translations.de;
  return {
    title: dict.paymentSuccessful,
  };
}

export default async function ToStaySuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ payment_intent?: string }>;
}) {
  const { organizationId } = await params;
  const { payment_intent } = await searchParams;

  if (!payment_intent) {
    redirect(`/to-stay/${organizationId}`);
  }

  return (
    <PaymentSuccessPoller
      paymentIntentId={payment_intent}
      organizationId={organizationId}
      type="dine-in"
    />
  );
}
