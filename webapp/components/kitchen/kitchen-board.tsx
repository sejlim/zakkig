"use client";

import { useState, useEffect } from "react";
import { Check, X, Clock } from "@phosphor-icons/react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "@/lib/i18n";
import { subscribeToOrders } from "@/lib/appwrite/realtime";
import { updateOrderStatusAction } from "@/actions/order-actions";
import { KITCHEN_CLEANUP_TIMEOUT } from "@/lib/constants";
import type { Organization, Order, OrderItem } from "@/lib/types";

interface KitchenBoardProps {
  organization: Organization;
  initialOrders: Order[];
}

function parseItems(itemsJson: string): OrderItem[] {
  try {
    return JSON.parse(itemsJson);
  } catch {
    return [];
  }
}

export function KitchenBoard({
  organization,
  initialOrders,
}: KitchenBoardProps) {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Keep time updated for "time since creation"
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Auto-cleanup completed orders after timeout
  useEffect(() => {
    const timer = setInterval(() => {
      setOrders((prev) =>
        prev.filter((order) => {
          if (order.status !== "completed" && order.status !== "ready")
            return true;
          const age = Date.now() - new Date(order.$updatedAt).getTime();
          return age < KITCHEN_CLEANUP_TIMEOUT;
        }),
      );
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Realtime subscription
  useEffect(() => {
    const unsubscribe = subscribeToOrders(organization.$id, (response) => {
      if (
        response.events.includes("databases.*.collections.*.documents.*.create")
      ) {
        setOrders((prev) => [response.payload as unknown as Order, ...prev]);
      } else if (
        response.events.includes("databases.*.collections.*.documents.*.update")
      ) {
        setOrders((prev) =>
          prev.map((o) =>
            o.$id === response.payload.$id
              ? (response.payload as unknown as Order)
              : o,
          ),
        );
      } else if (
        response.events.includes("databases.*.collections.*.documents.*.delete")
      ) {
        setOrders((prev) => prev.filter((o) => o.$id !== response.payload.$id));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [organization.$id]);

  const activeOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "preparing",
  );
  const completedOrders = orders.filter(
    (o) => o.status === "ready" || o.status === "completed",
  );

  async function handleMarkDone(order: Order) {
    // Optimistic update
    const newStatus = order.type === "dine-in" ? "completed" : "ready";
    setOrders((prev) =>
      prev.map((o) =>
        o.$id === order.$id
          ? { ...o, status: newStatus, $updatedAt: new Date().toISOString() }
          : o,
      ),
    );
    await updateOrderStatusAction(order.$id, newStatus, organization.$id);
  }

  async function handleClearOrder(order: Order) {
    // If it's already ready/completed, we can just hide it locally
    // Or we could update it to 'completed' if it was 'ready' and picked up.
    if (order.status === "ready") {
      await updateOrderStatusAction(order.$id, "completed", organization.$id);
    }
    setOrders((prev) => prev.filter((o) => o.$id !== order.$id));
  }

  function formatAge(createdAt: string) {
    const diffMins = Math.floor(
      (currentTime - new Date(createdAt).getTime()) / 60000,
    );
    if (diffMins < 1) return "< 1 min";
    return `${diffMins} min`;
  }

  return (
    <div className="flex h-screen w-full flex-col bg-muted/20 overflow-hidden">
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-6 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight">
          zakkig{" "}
          <span className="font-normal text-muted-foreground ml-2">
            Kitchen Board
          </span>
        </h1>
        <div className="font-medium">{organization.name}</div>
      </header>

      <div className="flex flex-1 gap-6 p-6 overflow-hidden">
        {/* In Progress Column */}
        <div className="flex flex-1 flex-col rounded-xl border bg-background shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
            <h2 className="font-semibold text-lg">{t("inProgress")}</h2>
            <Badge variant="secondary">{activeOrders.length}</Badge>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeOrders.map((order) => (
                <OrderCard
                  key={order.$id}
                  order={order}
                  items={parseItems(order.items)}
                  age={formatAge(order.$createdAt)}
                  actionButton={
                    <Button
                      className="w-full mt-4"
                      size="lg"
                      onClick={() => handleMarkDone(order)}
                    >
                      <Check data-icon="inline-start" className="mr-2" />
                      {t("markDone")}
                    </Button>
                  }
                />
              ))}
              {activeOrders.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  {t("noActiveOrders")}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Completed Column */}
        <div className="flex w-1/3 flex-col rounded-xl border bg-background shadow-sm overflow-hidden opacity-70">
          <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
            <h2 className="font-semibold text-lg">{t("done")}</h2>
            <Badge variant="secondary">{completedOrders.length}</Badge>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="flex flex-col gap-4">
              {completedOrders.map((order) => (
                <OrderCard
                  key={order.$id}
                  order={order}
                  items={parseItems(order.items)}
                  age={formatAge(order.$createdAt)}
                  actionButton={
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => handleClearOrder(order)}
                    >
                      <X data-icon="inline-start" className="mr-2" />
                      {t("clearOrder")}
                    </Button>
                  }
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  items,
  age,
  actionButton,
}: {
  order: Order;
  items: OrderItem[];
  age: string;
  actionButton: React.ReactNode;
}) {
  const { t } = useTranslation();
  const isUrgent = order.status === "pending" || order.status === "preparing";

  return (
    <Card className={isUrgent ? "border-primary/50 shadow-md" : "shadow-sm"}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xl font-bold">{order.orderNumber}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">
                {order.type === "dine-in" ? t("dineIn") : t("takeaway")}
              </Badge>
              {order.tableNumber && (
                <Badge variant="secondary" className="font-mono text-sm">
                  Tisch {order.tableNumber}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center text-muted-foreground text-sm font-medium bg-muted px-2 py-1 rounded-md">
            <Clock className="mr-1" />
            {age}
          </div>
        </div>
      </CardHeader>
      <div className="p-6 pt-0">
        <ul className="space-y-2 mt-2">
          {items.map((item) => (
            <li key={item.menuItemId} className="flex gap-2 text-lg">
              <span className="font-bold">{item.quantity}×</span>
              <span>{item.name}</span>
            </li>
          ))}
        </ul>
        {actionButton}
      </div>
    </Card>
  );
}
