"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslation } from "@/lib/i18n";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CheckCircle, CookingPot, X, Clock } from "@phosphor-icons/react";
import { playOrderReadySound, initAudioContext } from "@/lib/audio";
import { TRACKING_EXPIRY_MS } from "@/lib/constants";
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

  const liveOrder = useQuery(api.orders.getOrder, {
    id: orderId as Id<"orders">,
  });

  const order: Order | null = liveOrder
    ? {
        ...liveOrder,
        $id: liveOrder._id,
        $createdAt: new Date(liveOrder._creationTime).toISOString(),
      }
    : initialOrder || null;

  const prevStatusRef = useRef<string | null>(initialOrder?.status || null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const handleInteract = () => initAudioContext();
    window.addEventListener("click", handleInteract, { once: true });
    return () => window.removeEventListener("click", handleInteract);
  }, []);

  useEffect(() => {
    if (
      order?.status === "completed" &&
      prevStatusRef.current &&
      prevStatusRef.current !== "completed"
    ) {
      playOrderReadySound();
    }
    if (order?.status) {
      prevStatusRef.current = order.status;
    }
  }, [order?.status]);

  useEffect(() => {
    if (order?.status === "completed") {
      const interval = setInterval(() => {
        setNow(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [order?.status]);

  const completedTime =
    order?.completedAt ||
    (order?.$updatedAt ? new Date(order.$updatedAt).getTime() : 0) ||
    order?._creationTime ||
    (order?.$createdAt ? new Date(order.$createdAt).getTime() : Date.now());

  const remainingMs = Math.max(0, TRACKING_EXPIRY_MS - (now - completedTime));
  const isExpired = order?.status === "completed" && remainingMs <= 0;

  const error = (!order && liveOrder === null) || isExpired;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <h1 className="text-xl font-bold mb-2">{t("error")}</h1>
        <p className="text-muted-foreground mb-6">{t("trackingExpired")}</p>
        <Button
          variant="outline"
          className="font-semibold"
          onClick={() => (window.location.href = `/to-go/${organization.$id}`)}
        >
          {t("orderAgain" as any)}
        </Button>
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
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <X className="w-6 h-6" weight="bold" />
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

          {order.status === "in_progress" && (
            <div className="w-full bg-muted/40 border border-border/80 rounded-2xl p-5 text-center space-y-2 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <CookingPot className="w-5 h-5" weight="bold" />
              </div>
              <h2 className="text-base font-bold text-foreground">
                {t("inProgress")}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("inProgressDesc" as any)}
              </p>
            </div>
          )}

          {order.status === "completed" && (() => {
            const remainingTotalSeconds = Math.ceil(remainingMs / 1000);
            const remainingMins = Math.floor(remainingTotalSeconds / 60);
            const remainingSecs = remainingTotalSeconds % 60;
            const timeFormatted = `${remainingMins}:${remainingSecs.toString().padStart(2, "0")} Min.`;

            return (
              <div className="w-full bg-primary/10 border-2 border-primary/25 rounded-2xl p-6 text-center space-y-3 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center mx-auto">
                  <CheckCircle className="w-7 h-7" weight="fill" />
                </div>
                <h2 className="text-xl font-bold text-primary">
                  {t("orderReadyForPickup" as any)}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("orderReadyDesc" as any)}
                </p>
                <div className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full mt-1">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>{t("trackingActiveRemaining", { time: timeFormatted })}</span>
                </div>
              </div>
            );
          })()}

          <Card className="w-full p-5 sm:p-6 shadow-xs">
            <div>
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
