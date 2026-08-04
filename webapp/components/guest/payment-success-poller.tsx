"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getOrderByPaymentIntentAction } from "@/actions/checkout-actions";
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

  useEffect(() => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const result = await getOrderByPaymentIntentAction(paymentIntentId);
      
      if (result.order) {
        clearInterval(interval);
        clearCart();
        toast.success(t("orderPlaced" as any));
        
        if (type === "takeaway") {
          router.replace(`/to-go/${organizationId}?order=${result.order.$id}`);
        } else {
          router.replace(`/to-stay/${organizationId}?table=${result.order.tableNumber}`);
        }
      } else if (attempts > 15) { // 30 seconds
        clearInterval(interval);
        toast.error(t("error"));
        router.replace(`/${type === "takeaway" ? "to-go" : "to-stay"}/${organizationId}`);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [paymentIntentId, organizationId, type, router, clearCart, t]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center space-y-4 p-6 bg-background">
      <SpinnerGap className="w-10 h-10 animate-spin text-primary" />
      <p className="text-muted-foreground font-medium animate-pulse">
        <LocalizedText tKey="processingPayment" />
      </p>
    </div>
  );
}
