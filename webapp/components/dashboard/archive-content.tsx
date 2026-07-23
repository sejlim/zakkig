"use client";

import { useState } from "react";
import { MagnifyingGlass, Export } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { useTranslation, formatPrice } from "@/lib/i18n";
import { exportOrdersCSVAction } from "@/actions/order-actions";
import type { Order, OrderItem } from "@/lib/types";
import { RefreshButton } from "./refresh-button";

interface ArchiveContentProps {
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

export function ArchiveContent({ orders, organizationId }: ArchiveContentProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      pending: t("pending"),
      preparing: t("preparing"),
      ready: t("ready"),
      completed: t("completed"),
    };
    return labels[status] || status;
  }

  async function handleExportCSV() {
    const result = await exportOrdersCSVAction(organizationId);
    if (result.csv) {
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `zakkig-export-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exportiert");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("archive")}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Export data-icon="inline-start" className="mr-2" />
            {t("exportCSV")}
          </Button>
          <RefreshButton />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="relative max-w-sm">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder={t("search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            maxLength={100}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>

        <Card>
          <Table aria-label="Orders archive">
            <TableHeader>
              <TableRow>
                <TableHead>{t("orderNumber")}</TableHead>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("type")}</TableHead>
                <TableHead>{t("items")}</TableHead>
                <TableHead className="text-right">{t("total")}</TableHead>
                <TableHead>{t("status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    className="text-center text-muted-foreground py-8"
                    colSpan={6}
                  >
                    {t("noArchiveOrders")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const items = parseItems(order.items);
                  return (
                    <TableRow key={order.$id}>
                      <TableCell className="font-mono text-sm">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        <span suppressHydrationWarning>
                          {new Date(order.$createdAt).toLocaleDateString(
                            "de-DE",
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {order.type === "dine-in"
                            ? t("dineIn")
                            : t("takeaway")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {items
                          .map((item) => `${item.quantity}× ${item.name}`)
                          .join(", ")}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(order.total)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[order.status]}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
