"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslation } from "@/lib/i18n";
import { subscribeToOrder } from "@/lib/appwrite/realtime";
import type { Organization, Order } from "@/lib/types";

interface OrderTrackerProps {
  orderId: string;
  organization: Organization;
  initialOrder?: Order | null;
}

const statusSteps = [
  { id: "in_progress", labelKey: "inProgress" },
  { id: "completed", labelKey: "completed" },
];

export function OrderTracker({
  orderId,
  organization,
  initialOrder,
}: OrderTrackerProps) {
  const { t } = useTranslation();
  const [order, setOrder] = useState<Order | null>(initialOrder || null);
  const [error, setError] = useState(initialOrder === null);

  useEffect(() => {
    // If not provided from server, we might show error or keep loading
    if (!initialOrder) setError(true);

    // Realtime subscription
    const unsubscribe = subscribeToOrder(orderId, (response) => {
      const events = response.events || [];
      if (
        events.some(
          (e: string) => e.includes(".update") || e.includes("update"),
        )
      ) {
        setOrder(response.payload as unknown as Order);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [orderId, initialOrder]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <h1 className="text-xl font-bold mb-2">{t("error")}</h1>
        <p className="text-muted-foreground">{t("trackingExpired")}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-8 w-32 bg-muted rounded"></div>
          <div className="h-64 w-full max-w-sm bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (order.status === "cancelled") {
    return (
      <div className="flex flex-col min-h-screen bg-muted/10 items-center justify-center p-6">
        <Card className="max-w-md w-full p-6 text-center space-y-4 border-destructive/20 bg-destructive/5">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive font-bold text-xl">
            ✕
          </div>
          <h2 className="text-xl font-bold text-foreground">
            {t("orderCancelledTitle")}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t("orderCancelledDesc")}
          </p>
        </Card>
      </div>
    );
  }

  const currentStepIndex = order.status === "completed" ? 1 : 0;

  return (
    <div className="flex flex-col min-h-screen bg-muted/10">
      <header className="bg-background border-b px-6 py-4 flex items-center justify-between">
        <div className="w-10" />
        <h1 className="text-lg font-bold flex-1 text-center">
          {organization.name}
        </h1>
        <LanguageSwitcher className="w-10 h-10 -mr-2" />
      </header>

      <main className="flex-1 p-4 md:p-6 max-w-md mx-auto w-full flex flex-col items-center justify-center space-y-8">
        <div className="text-center">
          <p className="text-muted-foreground mb-1">{t("yourOrderNumber")}</p>
          <div className="text-4xl font-bold tabular-nums">
            {order.orderNumber}
          </div>
        </div>

        <Card className="w-full">
          <div className="pt-6">
            <h2 className="font-semibold text-lg mb-6">{t("orderStatus")}</h2>

            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent">
              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <div
                    key={step.id}
                    className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                  >
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 ${isCompleted ? "border-primary text-primary" : "border-muted text-muted-foreground bg-background"} ${isCurrent ? "!bg-primary text-primary-foreground border-primary" : ""}`}
                    >
                      {isCompleted && !isCurrent ? (
                        <svg
                          className="w-5 h-5 fill-current"
                          viewBox="0 0 20 20"
                        >
                          <path
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                            fillRule="evenodd"
                          ></path>
                        </svg>
                      ) : (
                        <span className="text-sm font-bold">{index + 1}</span>
                      )}
                    </div>
                    <div
                      className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl shadow-sm border ${isCurrent ? "border-primary/50 bg-primary/5" : "bg-background"}`}
                    >
                      <h3
                        className={`font-bold ${isCurrent ? "text-primary" : isCompleted ? "" : "text-muted-foreground"}`}
                      >
                        {t(step.labelKey as any)}
                      </h3>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {order.status === "completed" && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              (window.location.href = `/to-go/${organization.$id}`)
            }
          >
            Neue Bestellung
          </Button>
        )}
      </main>
    </div>
  );
}
