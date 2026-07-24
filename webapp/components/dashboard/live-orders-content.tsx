"use client";

import {
  useEffect,
  useState,
  useTransition,
  useOptimistic,
} from "react";
import {
  CircleDashed,
  CookingPot,
  CheckCircle,
  Copy,
  Plus,
  Trash,
  LinkSimple,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation, formatPrice } from "@/lib/i18n";
import { subscribeToOrders } from "@/lib/appwrite/realtime";
import { RefreshButton } from "./refresh-button";
import {
  updateOrderStatusAction,
  createOrderSessionAction,
  deleteOrderSessionAction,
} from "@/actions/order-actions";
import type { Order, OrderItem, OrderSession, Organization } from "@/lib/types";

interface LiveOrdersContentProps {
  orders: Order[];
  organizationId: string;
}

function parseItems(itemsJson: string): OrderItem[] {
  try {
    return JSON.parse(itemsJson);
  } catch {
    return [];
  }
}

const statusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "default",
  preparing: "secondary",
  ready: "default",
  completed: "outline",
};

export function LiveOrdersContent({
  orders,
  organizationId,
}: LiveOrdersContentProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [localOrders, setLocalOrders] = useState<Order[]>(orders);

  // Keep orders updated if initial prop changes
  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Realtime subscription
  useEffect(() => {
    const unsubscribe = subscribeToOrders(organizationId, (response) => {
      if (
        response.events.includes(
          "databases.*.collections.*.documents.*.create",
        )
      ) {
        const newOrder = response.payload as unknown as Order;
        setLocalOrders((prev) => [newOrder, ...prev]);
        toast.success(t("newOrder"), {
          description: `#${newOrder.orderNumber}`,
        });
      } else if (
        response.events.includes(
          "databases.*.collections.*.documents.*.update",
        )
      ) {
        const updatedOrder = response.payload as unknown as Order;
        setLocalOrders((prev) =>
          prev.map((o) =>
            o.$id === updatedOrder.$id ? updatedOrder : o,
          ),
        );
      } else if (
        response.events.includes(
          "databases.*.collections.*.documents.*.delete",
        )
      ) {
        setLocalOrders((prev) =>
          prev.filter((o) => o.$id !== response.payload.$id),
        );
      }
    });

    return () => {
      unsubscribe();
    };
  }, [organizationId, t]);

  const baseUrl =
    mounted && typeof window !== "undefined"
      ? window.location.origin
      : "https://app.zakkig.de";

  const activeOrders = localOrders.filter((o) => o.status !== "completed");

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      pending: t("pending"),
      preparing: t("preparing"),
      ready: t("ready"),
      completed: t("completed"),
    };
    return labels[status] || status;
  }

  async function handleStatusChange(orderId: string, newStatus: string) {
    await updateOrderStatusAction(orderId, newStatus, organizationId);
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2 print:hidden">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{t("orders")}</h1>
          {activeOrders.length > 0 && (
            <Badge variant="secondary">{activeOrders.length}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton />
        </div>
      </div>

      <div>
        {activeOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {t("noOrders")}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeOrders.map((order) => {
              const items = parseItems(order.items);
              return (
                <Card key={order.$id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between w-full">
                      <h3 className="text-base font-semibold">
                        {order.orderNumber}
                      </h3>
                      <Badge variant={statusVariants[order.status]}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <Badge variant="outline">
                        {order.type === "dine-in"
                          ? t("dineIn")
                          : t("takeaway")}
                      </Badge>
                      {order.tableNumber && (
                        <span>
                          {t("table")} {order.tableNumber}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2">
                      {items.map((item) => (
                        <div
                          key={item.menuItemId}
                          className="flex justify-between text-sm"
                        >
                          <span>
                            {item.quantity}× {item.name}
                          </span>
                          <span>
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                      <div className="mt-2 flex items-center justify-between border-t pt-2 font-medium">
                        <span>{t("total")}</span>
                        <span>{formatPrice(order.total)}</span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        {order.status === "pending" && (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() =>
                              handleStatusChange(order.$id, "preparing")
                            }
                          >
                            {t("preparing")}
                          </Button>
                        )}
                        {order.status === "preparing" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="flex-1"
                            onClick={() =>
                              handleStatusChange(order.$id, "ready")
                            }
                          >
                            {t("ready")}
                          </Button>
                        )}
                        {order.status === "ready" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="flex-1"
                            onClick={() =>
                              handleStatusChange(order.$id, "completed")
                            }
                          >
                            {t("completed")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

