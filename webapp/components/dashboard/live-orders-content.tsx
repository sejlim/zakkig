"use client";

import { useEffect, useState, useRef } from "react";
import { Check, ReceiptX, SpeakerHigh, SpeakerSlash, Clock } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTranslation, formatPrice } from "@/lib/i18n";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { updateOrderStatusAction } from "@/actions/order-actions";
import { playNewOrderSound, initAudioContext } from "@/lib/audio";
import { KITCHEN_CLEANUP_TIMEOUT } from "@/lib/constants";
import type { Order, OrderItem } from "@/lib/types";
import { useRouter } from "next/navigation";

interface LiveOrdersContentProps {
  orders: Order[];
  organizationId: string;
  isStaffView?: boolean;
}

function parseItems(itemsJson: string): OrderItem[] {
  try {
    return JSON.parse(itemsJson);
  } catch {
    return [];
  }
}

// Helper component for independent column stacking and larger kitchen-friendly typography
function OrderGrid({
  orders,
  onComplete,
  onCancel,
  t,
  now = Date.now(),
}: {
  orders: Order[];
  onComplete?: (orderId: string) => void;
  onCancel?: (orderId: string) => void;
  t: (key: any, params?: any) => string;
  now?: number;
}) {
  const leftOrders = orders.filter((_, i) => i % 2 === 0);
  const rightOrders = orders.filter((_, i) => i % 2 === 1);

  const formatOrderTime = (order: Order): string => {
    const timeMs =
      order._creationTime ||
      (order.$createdAt ? new Date(order.$createdAt).getTime() : 0);
    if (!timeMs) return "";
    const elapsedMinutes = Math.floor((now - timeMs) / (1000 * 60));
    if (elapsedMinutes < 1) return "Gerade eben";
    if (elapsedMinutes < 60) return `vor ${elapsedMinutes} Min.`;
    return new Date(timeMs).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderOrderCard = (order: Order) => {
    const items = parseItems(order.items);
    const timeLabel = formatOrderTime(order);

    const completedTime =
      order.completedAt ||
      (order.$updatedAt ? new Date(order.$updatedAt).getTime() : 0) ||
      order._creationTime ||
      (order.$createdAt ? new Date(order.$createdAt).getTime() : Date.now());
    const remainingMs = Math.max(0, KITCHEN_CLEANUP_TIMEOUT - (now - completedTime));
    const remainingMins = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));

    return (
      <Card key={order.$id} className="flex flex-col justify-between">
        <div>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-baseline gap-2 min-w-0">
                <h4 className="text-3xl font-black text-foreground tracking-tight tabular-nums shrink-0">
                  {order.orderNumber}
                </h4>
                {order.status === "completed" ? (
                  <span className="text-xs font-semibold text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3 text-primary" />
                    {t("autoArchiveRemaining", { time: `${remainingMins} Min.` })}
                  </span>
                ) : timeLabel ? (
                  <span className="text-xs font-semibold text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {timeLabel}
                  </span>
                ) : null}
              </div>
              <span className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight text-right truncate ml-2">
                {order.type === "dine-in" || order.tableNumber
                  ? `${t("toTable")} ${order.tableNumber || ""}`.trim()
                  : t("toPickUp")}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2 pb-4">
            <div className="flex flex-col gap-2.5">
              {items.map((item: any, index: number) => (
                <div
                  key={`${item.cartItemId || item.id || item.menuItemId || item.name}-${index}`}
                  className="flex flex-col py-1 border-b border-border/40 last:border-b-0 pb-1.5 last:pb-0"
                >
                  <div className="flex justify-between items-baseline text-base gap-2">
                    <span className="font-semibold text-foreground leading-snug break-words flex-1 min-w-0">
                      <span className="font-extrabold text-primary mr-2 text-lg shrink-0">
                        {item.quantity}×
                      </span>
                      {item.name}
                    </span>
                    <span className="text-muted-foreground text-sm font-medium shrink-0 ml-2">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                  {Array.isArray(item.customizations) && item.customizations.length > 0 && (
                    <div className="pl-6 pt-1 flex flex-wrap gap-1">
                      {item.customizations.map((c: any, cIdx: number) => (
                        <span
                          key={cIdx}
                          className="inline-flex items-center text-xs font-medium text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-md break-words"
                        >
                          +{c.optionName || c.name}
                          {c.extraPrice > 0 ? ` (${formatPrice(c.extraPrice)})` : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-3 flex items-center justify-between border-t pt-3 font-bold text-base">
                <span>{t("total")}</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </div>
        {(onComplete || onCancel) && (
          <div
            className={`p-4 pt-0 grid gap-2 w-full ${
              onComplete && onCancel
                ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-1"
                : "grid-cols-1"
            }`}
          >
            {onCancel && (
              <Button
                variant="outline"
                className="w-full font-semibold border-border text-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
                onClick={() => onCancel(order.$id)}
              >
                <ReceiptX className="w-4 h-4 mr-2 shrink-0" weight="bold" />
                {t("cancelOrder")}
              </Button>
            )}
            {onComplete && (
              <Button
                className="w-full font-semibold"
                onClick={() => onComplete(order.$id)}
              >
                <Check className="w-4 h-4 mr-2 shrink-0" weight="bold" />
                {t("completeAction")}
              </Button>
            )}
          </div>
        )}
      </Card>
    );
  };

  return (
    <>
      {/* < md and xl-to-2xl: Single column layout preserving natural order */}
      <div className="flex flex-col gap-4 w-full md:hidden xl:flex 2xl:hidden">
        {orders.map(renderOrderCard)}
      </div>

      {/* md-to-xl and >= 2xl: Two-column masonry layout where cards always take 50% width */}
      <div className="hidden md:grid xl:hidden 2xl:grid grid-cols-2 gap-4 items-start w-full">
        <div className="flex flex-col gap-4 w-full min-w-0">
          {leftOrders.map(renderOrderCard)}
        </div>
        <div className="flex flex-col gap-4 w-full min-w-0">
          {rightOrders.map(renderOrderCard)}
        </div>
      </div>
    </>
  );
}

export function LiveOrdersContent({
  orders,
  organizationId,
  isStaffView,
}: LiveOrdersContentProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [localOrders, setLocalOrders] = useState<Order[]>(orders);
  const [now, setNow] = useState<number>(Date.now());
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

  // Reactive Convex queries for live orders and org status
  const liveOrders = useQuery(api.orders.getLiveOrders, {
    organizationId: organizationId as Id<"organizations">,
  });
  const org = useQuery(api.organizations.get, {
    id: organizationId as Id<"organizations">,
  });

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const isInitialRef = useRef(true);
  const knownOrderIdsRef = useRef<Set<string>>(
    new Set(orders.map((o) => o.$id || (o as any)._id))
  );

  useEffect(() => {
    // Read saved sound preference
    const saved = localStorage.getItem("zakkig_kitchen_sound");
    if (saved !== null) {
      setSoundEnabled(saved === "1");
    }

    // Enable audio context on first click anywhere in the page
    const handleFirstClick = () => initAudioContext();
    window.addEventListener("click", handleFirstClick, { once: true });
    return () => window.removeEventListener("click", handleFirstClick);
  }, []);

  useEffect(() => {
    if (liveOrders) {
      const normalized = liveOrders.map((o: any) => ({
        ...o,
        $id: o._id,
        $createdAt: new Date(o._creationTime).toISOString(),
      }));

      // Detect new incoming orders (status: in_progress)
      if (!isInitialRef.current) {
        const newOrders = liveOrders.filter(
          (o: any) =>
            o.status === "in_progress" && !knownOrderIdsRef.current.has(o._id)
        );

        if (newOrders.length > 0) {
          if (soundEnabled) {
            playNewOrderSound();
          }
          newOrders.forEach((o: any) => {
            toast.info(`${t("newOrderReceived" as any)} #${o.orderNumber}`);
          });
        }
      }

      // Update known IDs
      liveOrders.forEach((o: any) => {
        knownOrderIdsRef.current.add(o._id);
      });
      isInitialRef.current = false;

      setLocalOrders(normalized);
    }
  }, [liveOrders, soundEnabled, t]);

  useEffect(() => {
    if (org === null) {
      toast.error(t("orgDeletedToast" as any));
      router.push("/");
    }
  }, [org, router, t]);

  if (!mounted) {
    return null;
  }

  const targetOrder = localOrders.find((o) => o.$id === orderToCancel);
  const inProgressOrders = localOrders.filter(
    (o) => o.status !== "completed" && o.status !== "cancelled",
  );
  const completedOrders = localOrders.filter((o) => {
    if (o.status !== "completed") return false;
    const timestamp = o.completedAt
      ? o.completedAt
      : o.$updatedAt
      ? new Date(o.$updatedAt).getTime()
      : new Date(o.$createdAt || o._creationTime || Date.now()).getTime();
    return now - timestamp < KITCHEN_CLEANUP_TIMEOUT;
  });

  async function handleStatusChange(
    orderId: string,
    newStatus: "in_progress" | "completed" | "cancelled"
  ) {
    // Optimistic UI update for instant feedback
    setLocalOrders((prev) =>
      prev.map((o) =>
        o.$id === orderId
          ? {
              ...o,
              status: newStatus as any,
              completedAt: newStatus === "completed" ? Date.now() : o.completedAt,
              $updatedAt: new Date().toISOString(),
            }
          : o,
      ),
    );
    await updateOrderStatusAction(orderId, newStatus, organizationId);
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2 print:hidden">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{t("orders")}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              initAudioContext();
              const next = !soundEnabled;
              setSoundEnabled(next);
              localStorage.setItem("zakkig_kitchen_sound", next ? "1" : "0");
              if (next) playNewOrderSound();
            }}
            className="h-9 gap-1.5 px-3 rounded-full text-xs font-semibold shadow-xs"
          >
            {soundEnabled ? (
              <>
                <SpeakerHigh className="w-4 h-4 text-primary" weight="fill" />
                <span>{t("soundOn" as any)}</span>
              </>
            ) : (
              <>
                <SpeakerSlash className="w-4 h-4 text-muted-foreground" />
                <span>{t("soundOff" as any)}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Side-by-Side Large Section Cards (Überkacheln) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Section 1: In Bearbeitung (In Progress) Big Card */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-start justify-between pb-2 gap-4">
            <div className="space-y-1 flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-foreground">
                {t("inProgress")}
              </h3>
              <p className="text-sm text-muted-foreground text-balance leading-relaxed">
                {t("inProgressSubline")}
              </p>
            </div>
            <Badge className="bg-primary text-secondary font-semibold text-xs px-2.5 py-0.5 shrink-0">
              {inProgressOrders.length}
            </Badge>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {inProgressOrders.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground font-medium border border-dashed rounded-lg">
                {t("noInProgressOrders")}
              </div>
            ) : (
              <OrderGrid
                orders={inProgressOrders}
                onComplete={(id) => handleStatusChange(id, "completed")}
                onCancel={(id) => setOrderToCancel(id)}
                t={t}
                now={now}
              />
            )}
          </CardContent>
        </Card>

        {/* Section 2: Abgeschlossen (Completed) Big Card */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-start justify-between pb-2 gap-4">
            <div className="space-y-1 flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-foreground">
                {t("completed")}
              </h3>
              <p className="text-sm text-muted-foreground text-balance leading-relaxed">
                {t("completedSubline")}
              </p>
            </div>
            <Badge className="bg-primary text-secondary font-semibold text-xs px-2.5 py-0.5 shrink-0">
              {completedOrders.length}
            </Badge>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {completedOrders.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground font-medium border border-dashed rounded-lg">
                {t("noCompletedRecentOrders")}
              </div>
            ) : (
              <OrderGrid
                orders={completedOrders}
                onCancel={(id) => setOrderToCancel(id)}
                t={t}
                now={now}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cancel Order Warning Dialog */}
      <Dialog
        open={!!orderToCancel}
        onOpenChange={(open) => !open && setOrderToCancel(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="bg-primary text-primary-foreground border-border/20 sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="text-primary-foreground text-lg font-bold">
              {targetOrder
                ? t("cancelOrderTitle", {
                    orderNumber: targetOrder.orderNumber,
                  })
                : t("cancelOrderTitleFallback")}
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 text-sm leading-relaxed mt-1">
              {t("cancelOrderWarning")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex w-full gap-3 mt-3">
            <Button
              variant="outline"
              onClick={() => setOrderToCancel(null)}
              className="flex-1 bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10 text-primary-foreground hover:text-primary-foreground font-semibold"
            >
              {t("abortCancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (orderToCancel) {
                  handleStatusChange(orderToCancel, "cancelled");
                  setOrderToCancel(null);
                  toast.success(t("orderCancelledTitle"));
                }
              }}
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2 font-semibold"
            >
              <ReceiptX className="h-4 w-4 shrink-0" weight="bold" />
              <span>{t("confirmCancelOrder")}</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
