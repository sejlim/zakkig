"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LocalizedText } from "@/components/ui/localized-text";
import { SpinnerGap } from "@phosphor-icons/react";
import { useCartStore } from "@/store/cart-store";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";

export function PaymentSuccessPoller({
  paymentIntentId,
  organizationId,
  type,
}: {
  paymentIntentId: string;
  organizationId: string;
  type: "takeaway" | "dine-in";
}) {
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clearCart);
  const { t } = useTranslation();
  const [timedOut, setTimedOut] = useState(false);

  // Reactive subscription to order created via webhook
  const order = useQuery(api.orders.getOrderByPaymentIntent, {
    stripePaymentId: paymentIntentId,
  });

  const verifyPayment = useAction(api.stripe.verifyPaymentAndCreateOrder);

  // If webhook is delayed or in local development, verify directly with Stripe
  useEffect(() => {
    if (order === null) {
      const timer = setTimeout(() => {
        verifyPayment({ paymentIntentId }).catch(console.error);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [order, paymentIntentId, verifyPayment]);

  useEffect(() => {
    if (order) {
      clearCart();
      toast.success(t("orderPlaced" as any));

      if (type === "takeaway") {
        router.replace(`/to-go/${organizationId}?order=${order._id}`);
      } else {
        router.replace(`/to-stay/${organizationId}?table=${order.tableNumber || ""}`);
      }
    }
  }, [order, organizationId, type, router, clearCart, t]);

  // Fallback safety timeout (45s) in case webhook fails completely
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!order) {
        setTimedOut(true);
        toast.error(t("error"));
        router.replace(`/${type === "takeaway" ? "to-go" : "to-stay"}/${organizationId}`);
      }
    }, 45000);

    return () => clearTimeout(timer);
  }, [order, organizationId, type, router, t]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center space-y-4 p-6 bg-background">
      <SpinnerGap className="w-10 h-10 animate-spin text-primary" />
      <p className="text-muted-foreground font-medium animate-pulse">
        <LocalizedText tKey="processingPayment" />
      </p>
    </div>
  );
}
