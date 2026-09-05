"use client";

import { useState, useTransition } from "react";
import {
  AppleLogo,
  CreditCard,
  GoogleLogo,
  CircleNotch,
} from "@phosphor-icons/react";
import { useTranslation, formatPrice } from "@/lib/i18n";
import { useCartStore } from "@/store/cart-store";
import { createPaymentIntentAction } from "@/actions/checkout-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { CheckoutForm } from "./checkout-form";

import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Organization } from "@/lib/types";

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization;
  type: "dine-in" | "takeaway";
  tableNumber?: string;
  onOrderSuccess: (orderId: string, orderNumber: string) => void;
}

export function CartSheet({
  open,
  onOpenChange,
  organization,
  type,
  tableNumber,
  onOrderSuccess,
}: CartSheetProps) {
  const { t, locale } = useTranslation();
  const { items, total } = useCartStore();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [stripePromise] = useState(() => {
    return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  });

  async function onContinueToPayment(formData: FormData) {
    const email = formData.get("email") as string;

    if (!email) {
      toast.error(t("error"));
      return;
    }

    if (email.length > 100) {
      toast.error(t("emailTooLong"));
      return;
    }

    startTransition(async () => {
      const result = await createPaymentIntentAction({
        organizationId: organization.$id,
        type,
        tableNumber,
        items,
        total: total(),
        email,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.clientSecret) {
        setClientSecret(result.clientSecret);
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90vh] sm:h-auto rounded-t-xl px-4 max-w-[500px] mx-auto"
      >
        <SheetHeader className="text-left mb-6">
          <SheetTitle>{t("checkout")}</SheetTitle>
          <div className="text-sm text-muted-foreground mt-2">
            {t("orderTotal")}:{" "}
            <span className="font-bold text-foreground">
              {formatPrice(total())}
            </span>
          </div>
        </SheetHeader>

        <div className="p-0">
          {!organization.stripeOnboardingComplete ? (
            <div className="p-4 text-center">
              <p className="text-destructive font-medium mb-2">{t("onlineOrderingUnavailable" as any)}</p>
              <p className="text-sm text-muted-foreground">{t("onlineOrderingUnavailableDesc" as any)}</p>
            </div>
          ) : !clientSecret ? (
            <form
              action={onContinueToPayment}
              noValidate
              className="space-y-6 overflow-y-auto max-h-[calc(90vh-8rem)] pb-8 px-1"
            >
              <div className="space-y-2">
                <Label htmlFor="email">{t("emailForReceipt")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@beispiel.de"
                  maxLength={100}
                  required
                />
              </div>

              <Separator />

              <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
                <p>
                  <strong>{t("buyingFrom")}</strong> {organization.name}
                </p>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full rounded-full font-bold h-12 text-base shadow-md"
                disabled={isPending}
              >
                {isPending && (
                  <CircleNotch className="mr-2 h-5 w-5 animate-spin" />
                )}
                {isPending ? t("loading") : t("continueToPayment")}
              </Button>

              <p className="text-center text-muted-foreground text-xs leading-relaxed mt-2">
                {t("paymentDisclaimer")} {t("agreeToTerms")}
              </p>
            </form>
          ) : (
            <div className="px-1 pb-8 overflow-y-auto max-h-[calc(90vh-8rem)]">
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' }, locale: locale as any }}>
                <CheckoutForm returnUrl={`${window.location.origin}/${type === "dine-in" ? "to-stay" : "to-go"}/${organization.$id}/success`} />
              </Elements>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
