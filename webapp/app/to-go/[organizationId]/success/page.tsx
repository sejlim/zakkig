import { PaymentSuccessPoller } from "@/components/guest/payment-success-poller";
import { redirect } from "next/navigation";

export default async function ToGoSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ payment_intent?: string }>;
}) {
  const { organizationId } = await params;
  const { payment_intent } = await searchParams;

  if (!payment_intent) {
    redirect(`/to-go/${organizationId}`);
  }

  return (
    <PaymentSuccessPoller
      paymentIntentId={payment_intent}
      organizationId={organizationId}
      type="takeaway"
    />
  );
}
