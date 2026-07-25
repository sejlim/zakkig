"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  CheckCircle,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  t,
}: {
  orders: Order[];
  onComplete?: (orderId: string) => void;
  t: (key: any) => string;
}) {
  const leftOrders = orders.filter((_, i) => i % 2 === 0);
  const rightOrders = orders.filter((_, i) => i % 2 === 1);

  const renderOrderCard = (order: Order) => {
    const items = parseItems(order.items);
    return (
      <Card
        key={order.$id}
        className="flex flex-col justify-between"
      >
        <div>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between w-full">
              <h4 className="text-base font-mono font-bold text-foreground">
                #{order.orderNumber}
              </h4>
              <Badge variant="outline">
                {order.type === "dine-in" || order.tableNumber
                  ? `${t("toTable")} ${order.tableNumber || ""}`.trim()
                  : t("toPickUp")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2 pb-4">
            <div className="flex flex-col gap-2.5">
              {items.map((item, idx) => (
                <div
                  key={`${item.menuItemId || "item"}-${idx}`}
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
        {onComplete && (
          <div className="p-4 pt-0">
            <Button
              size="sm"
              className="w-full font-semibold"
              onClick={() => onComplete(order.$id)}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {t("completeAction")}
            </Button>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="flex flex-col 2xl:flex-row gap-4 items-start w-full">
      <div className="flex flex-col gap-4 flex-1 min-w-0 w-full">
        {leftOrders.map(renderOrderCard)}
      </div>
      {rightOrders.length > 0 && (
        <div className="flex flex-col gap-4 flex-1 min-w-0 w-full">
          {rightOrders.map(renderOrderCard)}
        </div>
      )}
    </div>
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

  // Keep orders updated if initial prop changes
  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

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
      const isCreate = events.some((e: string) => e.includes(".create") || e.includes("create"));
      const isUpdate = events.some((e: string) => e.includes(".update") || e.includes("update"));
      const isDelete = events.some((e: string) => e.includes(".delete") || e.includes("delete"));

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
          prev.map((o) =>
            o.$id === updatedOrder.$id ? updatedOrder : o,
          ),
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

  const inProgressOrders = localOrders.filter((o) => o.status !== "completed");
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
          ? { ...o, status: newStatus as any, $updatedAt: new Date().toISOString() }
          : o,
      ),
    );
    await updateOrderStatusAction(orderId, newStatus, organizationId);
  }

  return (
      <div className="flex-1 space-y-8 pb-12">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
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
                <OrderGrid orders={completedOrders} t={t} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
  );
}
