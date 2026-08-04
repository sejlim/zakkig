"use client";

import { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { SpinnerGap } from "@phosphor-icons/react";
import { toast } from "sonner";

export function CheckoutForm({ returnUrl }: { returnUrl: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        toast.error(error.message || t("paymentFailed" as any));
      } else {
        toast.error(t("error"));
      }
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
      <PaymentElement options={{ layout: "tabs" }} />
      <Button 
        disabled={!stripe || isProcessing} 
        type="submit" 
        className="w-full h-14 text-lg"
      >
        {isProcessing ? <SpinnerGap className="mr-2 h-5 w-5 animate-spin" /> : null}
        {isProcessing ? t("processingPayment" as any) : t("orderAndPay" as any)}
      </Button>
    </form>
  );
}
