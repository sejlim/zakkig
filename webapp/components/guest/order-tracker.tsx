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
    // If not provided from server, show error
    if (!initialOrder) setError(true);

    // Appwrite Realtime WebSocket subscription
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
    <div className="flex flex-col min-h-screen bg-primary">
      <header className="bg-primary text-primary-foreground px-6 py-4 flex items-center justify-between shrink-0">
        <div className="w-10" />
        <h1 className="text-lg font-bold flex-1 text-center">
          {organization.name}
        </h1>
        <LanguageSwitcher
          className="h-9 px-2 text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10 rounded-full"
          variant="ghost"
        />
      </header>

      {/* Main Content Card */}
      <div className="flex-1 bg-background text-foreground rounded-t-[2rem] md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:my-4 md:max-w-md md:mx-auto w-full border-t md:border border-primary-foreground/10">
        <main className="flex-1 p-6 md:p-8 flex flex-col items-center justify-center space-y-8">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{t("yourOrderNumber")}</p>
            <div className="text-6xl font-black tracking-wider text-primary tabular-nums">
              {order.orderNumber}
            </div>
          </div>

          {order.status === "completed" && (
            <div className="w-full bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl p-6 text-center space-y-2 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold">
                ✓
              </div>
              <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                {t("orderReadyForPickup" as any)}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("orderReadyDesc" as any)}
              </p>
            </div>
          )}

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
              className="w-full h-12 text-base font-semibold"
              onClick={() =>
                (window.location.href = `/to-go/${organization.$id}`)
              }
            >
              {t("orderAgain" as any)}
            </Button>
          )}
        </main>
      </div>
    </div>
  );
}
