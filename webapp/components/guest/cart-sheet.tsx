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

function formatAddressLines(address?: string): string[] {
  if (!address || !address.trim()) return [];
  if (address.includes("\n")) {
    return address
      .split(/[\r\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (address.includes(",")) {
    return address
      .split(/,\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [address.trim()];
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
    const rawEmail = formData.get("email") as string;
    const email = rawEmail?.trim() ?? "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t("emailInvalid"));
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
        className="h-[90vh] sm:h-auto rounded-t-2xl px-5 pt-5 pb-6 sm:px-6 sm:pt-6 sm:pb-8 max-w-[500px] mx-auto"
      >
        <SheetHeader className="p-0 text-left mb-5">
          <SheetTitle className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            {t("checkout")}
          </SheetTitle>
          <div className="flex items-baseline justify-between mt-1.5 w-full">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-bold text-foreground">
                {t("total")}
              </span>
              <span className="text-xs text-muted-foreground font-normal">
                {t("taxNote")}
              </span>
            </div>
            <span className="text-base sm:text-lg font-bold text-foreground tabular-nums text-right">
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
              className="space-y-6 overflow-y-auto max-h-[calc(90vh-8rem)] pb-8"
            >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                  {t("emailForReceipt")}
                </Label>
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

              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {t("buyingFrom")}
                </p>
                <p className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                  {organization.name}
                </p>
                {organization.address?.trim() && (
                  <div className="text-xs text-muted-foreground space-y-0.5 pt-0.5">
                    {formatAddressLines(organization.address).map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full rounded-full font-bold h-12 text-base shadow-md bg-primary text-primary-foreground hover:bg-neutral-800 active:scale-[0.98] transition-all cursor-pointer"
                disabled={isPending}
              >
                {isPending && (
                  <CircleNotch className="mr-2 h-5 w-5 animate-spin" />
                )}
                {isPending ? t("loading") : t("continueToPayment")}
              </Button>

              <p className="text-center text-muted-foreground text-xs leading-relaxed mt-2">
                {t("paymentDisclaimer")}{" "}
                {t("agreeToTermsPrefix")}
                <a
                  href={t("termsUrl")}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  {t("termsGtc")}
                </a>
                {t("agreeToTermsMiddle")}
                <a
                  href={t("privacyUrl")}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  {t("privacyPolicy")}
                </a>
                {t("agreeToTermsSuffix")}
              </p>
            </form>
          ) : (
            <div className="pb-8 overflow-y-auto max-h-[calc(90vh-8rem)]">
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
