"use client";

import { useState } from "react";
import {
  MagnifyingGlass,
  DownloadSimple,
  CaretUpDown,
  CaretDown,
  CaretUp,
  X,
  Funnel,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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

type SortConfig = {
  key: keyof Order | "items";
  direction: "asc" | "desc";
} | null;

const statusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  in_progress: "secondary",
  completed: "outline",
  cancelled: "destructive",
};

export function ArchiveContent({
  orders,
  organizationId,
}: ArchiveContentProps) {
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState("");

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "$createdAt",
    direction: "desc",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  let processedOrders = [...orders];

  // 1. Filter
  if (selectedTypes.length > 0) {
    processedOrders = processedOrders.filter((o) => {
      const isDineIn = o.type === "dine-in" || !!o.tableNumber;
      if (selectedTypes.includes("dine-in") && isDineIn) return true;
      if (selectedTypes.includes("takeaway") && !isDineIn) return true;
      return false;
    });
  }
  if (selectedStatuses.length > 0) {
    processedOrders = processedOrders.filter((o) =>
      selectedStatuses.includes(o.status),
    );
  }

  // 2. Search
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    processedOrders = processedOrders.filter((o) => {
      const searchString = [
        o.orderNumber,
        o.$id,
        o.email || "",
        getStatusLabel(o.status),
        o.type === "dine-in" || o.tableNumber
          ? `${t("toTable")} ${o.tableNumber || ""}`.trim()
          : t("toPickUp"),
        formatPrice(o.total),
        o.items,
      ]
        .join(" ")
        .toLowerCase();

      return searchString.includes(query);
    });
  }

  // 3. Sort
  processedOrders.sort((a, b) => {
    if (!sortConfig) return 0;

    let aVal: any = a[sortConfig.key as keyof Order];
    let bVal: any = b[sortConfig.key as keyof Order];

    if (sortConfig.key === "items") {
      aVal = parseItems(a.items).length;
      bVal = parseItems(b.items).length;
    }
    if (sortConfig.key === "total") {
      aVal = Number(aVal);
      bVal = Number(bVal);
    }
    if (sortConfig.key === "$createdAt") {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }

    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // 4. Pagination
  const totalPages = Math.ceil(processedOrders.length / itemsPerPage) || 1;
  const paginatedOrders = processedOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleSort = (key: keyof Order | "items") => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key: string) => {
    if (sortConfig?.key !== key)
      return (
        <CaretUpDown className="ml-1.5 h-4 w-4 text-muted-foreground shrink-0" />
      );
    return sortConfig.direction === "asc" ? (
      <CaretUp className="ml-1.5 h-3.5 w-3.5 shrink-0" weight="bold" />
    ) : (
      <CaretDown className="ml-1.5 h-3.5 w-3.5 shrink-0" weight="bold" />
    );
  };

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      in_progress: t("inProgress"),
      completed: t("completed"),
      cancelled: t("cancelledOrder"),
    };
    return labels[status] || status;
  }

  function handleTypeToggle(type: string, checked: boolean) {
    if (checked) {
      setSelectedTypes((prev) => [...prev, type]);
    } else {
      setSelectedTypes((prev) => prev.filter((t) => t !== type));
    }
    setCurrentPage(1);
  }

  function handleStatusToggle(status: string, checked: boolean) {
    if (checked) {
      setSelectedStatuses((prev) => [...prev, status]);
    } else {
      setSelectedStatuses((prev) => prev.filter((s) => s !== status));
    }
    setCurrentPage(1);
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
    }
  }

  const dateFormatter = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("archive")}</h1>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Controls Layout */}
        <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          <div className="flex flex-col md:flex-row flex-1 items-start md:items-center gap-3 w-full">
            {/* Search Input & Selector */}
            <div className="flex w-full md:max-w-md items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder={t("search")}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  maxLength={100}
                  className="pl-9 pr-9 bg-background"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setCurrentPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                    title={t("clearSearch")}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Multi-Select */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="default"
                    className="justify-between min-w-[120px]"
                  >
                    <div className="flex items-center gap-2">
                      <Funnel className="h-4 w-4 mr-2" />
                      {selectedTypes.length === 0 &&
                      selectedStatuses.length === 0 ? (
                        <span>{t("filters")}</span>
                      ) : (
                        <span className="text-primary-foreground font-medium">
                          {selectedTypes.length + selectedStatuses.length}{" "}
                          {t("filters")}
                        </span>
                      )}
                    </div>
                    <CaretDown className="h-4 w-4 opacity-50" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{t("filterType")}</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={selectedTypes.includes("takeaway")}
                    onCheckedChange={(c) => handleTypeToggle("takeaway", c)}
                  >
                    {t("toPickUp")}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedTypes.includes("dine-in")}
                    onCheckedChange={(c) => handleTypeToggle("dine-in", c)}
                  >
                    {t("toTable")}
                  </DropdownMenuCheckboxItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuLabel>{t("filterStatus")}</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={selectedStatuses.includes("in_progress")}
                    onCheckedChange={(c) =>
                      handleStatusToggle("in_progress", c)
                    }
                  >
                    {t("inProgress")}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedStatuses.includes("completed")}
                    onCheckedChange={(c) => handleStatusToggle("completed", c)}
                  >
                    {t("completed")}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedStatuses.includes("cancelled")}
                    onCheckedChange={(c) => handleStatusToggle("cancelled", c)}
                  >
                    {t("cancelledOrder")}
                  </DropdownMenuCheckboxItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button
            variant="default"
            onClick={handleExportCSV}
            className="w-full xl:w-auto shrink-0"
          >
            <DownloadSimple className="mr-2 h-4 w-4" weight="bold" />
            {t("exportCSV")}
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table aria-label="Orders archive">
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 transition-colors whitespace-nowrap"
                    onClick={() => handleSort("$id")}
                  >
                    <div className="flex items-center">
                      {t("id")}
                      {renderSortIcon("$id")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 transition-colors whitespace-nowrap"
                    onClick={() => handleSort("orderNumber")}
                  >
                    <div className="flex items-center">
                      {t("orderNumber")}
                      {renderSortIcon("orderNumber")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 transition-colors whitespace-nowrap"
                    onClick={() => handleSort("$createdAt")}
                  >
                    <div className="flex items-center">
                      {t("datetime")}
                      {renderSortIcon("$createdAt")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 transition-colors whitespace-nowrap"
                    onClick={() => handleSort("type")}
                  >
                    <div className="flex items-center">
                      {t("type")}
                      {renderSortIcon("type")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 transition-colors min-w-[200px]"
                    onClick={() => handleSort("items")}
                  >
                    <div className="flex items-center">
                      {t("items")}
                      {renderSortIcon("items")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 transition-colors text-right whitespace-nowrap"
                    onClick={() => handleSort("total")}
                  >
                    <div className="flex items-center justify-end">
                      {t("total")}
                      {renderSortIcon("total")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 transition-colors whitespace-nowrap"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center">
                      {t("status")}
                      {renderSortIcon("status")}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      className="text-center text-muted-foreground py-12"
                      colSpan={7}
                    >
                      {t("noArchiveOrders")}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOrders.map((order) => {
                    const items = parseItems(order.items);
                    const shortId =
                      order.$id.length > 8
                        ? "..." + order.$id.slice(-8)
                        : order.$id;
                    const isCancelled = order.status === "cancelled";

                    return (
                      <TableRow key={order.$id} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <span className="cursor-help border-b border-dotted border-muted-foreground/50" />
                                }
                              >
                                {shortId}
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{order.$id}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="font-medium tabular-nums text-sm">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <span suppressHydrationWarning>
                            {dateFormatter.format(new Date(order.$createdAt))}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {order.type === "dine-in" || order.tableNumber
                            ? `${t("toTable")} ${order.tableNumber || ""}`.trim()
                            : t("toPickUp")}
                        </TableCell>
                        <TableCell className="text-sm min-w-[250px]">
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {items.map((item, idx) => (
                              <div
                                key={`${item.menuItemId}-${idx}`}
                                className="whitespace-nowrap"
                              >
                                <span className="font-semibold">
                                  {item.quantity}×
                                </span>{" "}
                                {item.name}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatPrice(order.total)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              isCancelled
                                ? undefined
                                : (statusVariants[order.status] as any)
                            }
                            className={
                              isCancelled
                                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-transparent shadow-sm"
                                : ""
                            }
                          >
                            {getStatusLabel(order.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Pagination & Items Per Page Controls */}
        <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t("itemsPerPage")}</span>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    className="w-[80px] justify-between"
                  >
                    {itemsPerPage}
                    <CaretDown className="h-4 w-4 opacity-50" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                {[10, 20, 50, 100].map((size) => (
                  <DropdownMenuItem
                    key={size}
                    onClick={() => {
                      setItemsPerPage(size);
                      setCurrentPage(1);
                    }}
                  >
                    {size}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center flex-1">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      text={t("previousPage")}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage((p) => Math.max(1, p - 1));
                      }}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(page);
                              }}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }

                      if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <PaginationItem key={`ellipsis-${page}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }

                      return null;
                    },
                  )}

                  <PaginationItem>
                    <PaginationNext
                      text={t("nextPage")}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage((p) => Math.min(totalPages, p + 1));
                      }}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
          {/* Spacer for right alignment balancing */}
          <div className="hidden md:block md:w-[150px]"></div>
        </div>
      </div>
    </div>
  );
}
