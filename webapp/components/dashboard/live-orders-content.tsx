"use client";

import { useEffect, useState } from "react";
import { Check, ReceiptX } from "@phosphor-icons/react";
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
import { subscribeToOrders } from "@/lib/appwrite/realtime";
import { RefreshButton } from "./refresh-button";
import { updateOrderStatusAction } from "@/actions/order-actions";
import { KITCHEN_CLEANUP_TIMEOUT } from "@/lib/constants";
import type { Order, OrderItem } from "@/lib/types";

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
}: {
  orders: Order[];
  onComplete?: (orderId: string) => void;
  onCancel?: (orderId: string) => void;
  t: (key: any, params?: any) => string;
}) {
  const leftOrders = orders.filter((_, i) => i % 2 === 0);
  const rightOrders = orders.filter((_, i) => i % 2 === 1);

  const renderOrderCard = (order: Order) => {
    const items = parseItems(order.items);
    return (
      <Card key={order.$id} className="flex flex-col justify-between">
        <div>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between w-full">
              <h4 className="text-2xl font-extrabold text-foreground tracking-tight tabular-nums shrink-0">
                {order.orderNumber}
              </h4>
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
                  key={`${item.cartItemId || item.id || item.menuItemId || 'item'}-${index}`}
                  className="flex justify-between items-baseline text-base py-0.5"
                >
                  <span className="font-semibold text-foreground leading-snug">
                    <span className="font-extrabold text-primary mr-2 text-lg">
                      {item.quantity}×
                    </span>
                    {item.name}
                  </span>
                  <span className="text-muted-foreground text-sm font-medium shrink-0 ml-2">
                    {formatPrice(item.price * item.quantity)}
                  </span>
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
  const [mounted, setMounted] = useState(false);
  const [localOrders, setLocalOrders] = useState<Order[]>(orders);
  const [now, setNow] = useState<number>(Date.now());
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

  const [prevOrdersProp, setPrevOrdersProp] = useState<Order[]>(orders);

  if (orders !== prevOrdersProp) {
    setPrevOrdersProp(orders);
    setLocalOrders(orders);
  }

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Realtime subscription
  useEffect(() => {
    const unsubscribe = subscribeToOrders(organizationId, (response) => {
      const events = response.events || [];
      const isCreate = events.some(
        (e: string) => e.includes(".create") || e.includes("create"),
      );
      const isUpdate = events.some(
        (e: string) => e.includes(".update") || e.includes("update"),
      );
      const isDelete = events.some(
        (e: string) => e.includes(".delete") || e.includes("delete"),
      );

      if (isCreate) {
        const newOrder = response.payload as unknown as Order;
        setLocalOrders((prev) => {
          if (prev.some((o) => o.$id === newOrder.$id)) return prev;
          return [newOrder, ...prev];
        });
        toast.success(t("newOrder"), {
          description: `#${newOrder.orderNumber}`,
        });
      } else if (isUpdate) {
        const updatedOrder = response.payload as unknown as Order;
        setLocalOrders((prev) =>
          prev.map((o) => (o.$id === updatedOrder.$id ? updatedOrder : o)),
        );
      } else if (isDelete) {
        setLocalOrders((prev) =>
          prev.filter((o) => o.$id !== response.payload.$id),
        );
      }
    });

    return () => {
      unsubscribe();
    };
  }, [organizationId, t]);

  if (!mounted) {
    return null;
  }

  const targetOrder = localOrders.find((o) => o.$id === orderToCancel);
  const inProgressOrders = localOrders.filter(
    (o) => o.status !== "completed" && o.status !== "cancelled",
  );
  const completedOrders = localOrders.filter((o) => {
    if (o.status !== "completed") return false;
    const timestamp = o.$updatedAt
      ? new Date(o.$updatedAt).getTime()
      : new Date(o.$createdAt).getTime();
    return now - timestamp < KITCHEN_CLEANUP_TIMEOUT;
  });

  async function handleStatusChange(orderId: string, newStatus: string) {
    // Optimistic UI update for instant feedback
    setLocalOrders((prev) =>
      prev.map((o) =>
        o.$id === orderId
          ? {
              ...o,
              status: newStatus as any,
              $updatedAt: new Date().toISOString(),
            }
          : o,
      ),
    );
    await updateOrderStatusAction(orderId, newStatus, organizationId);
  }

  return (
    <div className="flex-1 space-y-4 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between space-y-2 print:hidden">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{t("orders")}</h1>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton />
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
              <div className="py-12 text-center text-muted-foreground font-medium border-2 border-dashed rounded-lg">
                {t("noInProgressOrders")}
              </div>
            ) : (
              <OrderGrid
                orders={inProgressOrders}
                onComplete={(id) => handleStatusChange(id, "completed")}
                onCancel={(id) => setOrderToCancel(id)}
                t={t}
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
              <div className="py-12 text-center text-muted-foreground font-medium border-2 border-dashed rounded-lg">
                {t("noCompletedRecentOrders")}
              </div>
            ) : (
              <OrderGrid
                orders={completedOrders}
                onCancel={(id) => setOrderToCancel(id)}
                t={t}
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
