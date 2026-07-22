"use client";

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useTransition,
  useOptimistic,
} from "react";
import {
  Copy,
  Plus,
  Trash,
  LinkSimple,
  ChartLineUp,
  ShoppingBag,
  Printer,
  Scissors,
  CaretDown,
  ClipboardText,
  ForkKnife,
  Gear,
  Archive,
  CheckSquare,
  Check,
  SelectionAll,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useTranslation, formatPrice } from "@/lib/i18n";
import { toggleFeatureAction, updateTablesAction } from "@/actions/settings-actions";
import { RefreshButton } from "./refresh-button";
import { cn } from "@/lib/utils";
import type { Organization, Order } from "@/lib/types";
import { ReactQRCode } from "@lglab/react-qr-code";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const OverviewChart = dynamic(() => import("./overview-chart"), { ssr: false });

const handlePrint = () => {
  window.print();
};

function StyledQRCode({ value, size }: { value: string; size: number }) {
  return (
    <div className="flex items-center justify-center">
      <ReactQRCode
        value={value}
        size={size}
        level="H"
        background="#FFFFFF"
        dataModulesSettings={{ color: "#000000", style: "square-sm" }}
        finderPatternOuterSettings={{ color: "#000000", style: "square" }}
        finderPatternInnerSettings={{ color: "#000000", style: "square" }}
        imageSettings={{
          src: "https://www.zakkig.de/icon.png",
          height: 70,
          width: 70,
          excavate: true,
        }}
      />
    </div>
  );
}

function ScaledText({ text, className }: { text: string; className?: string }) {
  const textRef = useRef<SVGTextElement>(null);
  const [viewBox, setViewBox] = useState(() => {
    const estWidth = Math.max(text.length * 15, 50);
    return `0 -15 ${estWidth} 30`;
  });
  
  useEffect(() => {
    if (textRef.current) {
      try {
        const bbox = textRef.current.getBBox();
        setViewBox(`${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
      } catch (e) {}
    }
  }, [text]);

  return (
    <svg viewBox={viewBox} className={cn("w-full h-auto overflow-visible", className)}>
      <text
        ref={textRef}
        x="0"
        y="0"
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        className="font-black uppercase tracking-tighter"
      >
        {text}
      </text>
    </svg>
  );
}

type TimePeriod = "24h" | "30d" | "90d";

function filterOrdersByPeriod(orders: Order[], period: TimePeriod): Order[] {
  const now = Date.now();
  const ms = {
    "24h": 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
    "90d": 90 * 24 * 60 * 60 * 1000,
  };
  return orders.filter(
    (o) => now - new Date(o.$createdAt).getTime() < ms[period],
  );
}

function SortableTableItem({ tNum, isSelected, onToggle }: { tNum: string; isSelected: boolean; onToggle: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: tNum });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "flex items-center justify-center border rounded-md px-3 py-2 h-10 cursor-grab active:cursor-grabbing transition-colors text-center font-medium touch-none", 
        isSelected ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/50 bg-background text-foreground"
      )}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      {tNum}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

function StatisticsCard({ orders, period, setPeriod, isMobile, mounted }: any) {
  const { t } = useTranslation();

  const filtered = filterOrdersByPeriod(orders, period);
  const totalOrders = filtered.length;
  const totalRevenue = filtered.reduce((sum, o: any) => sum + o.total, 0);
  const netRevenue = totalRevenue * 0.975;

  const chartConfig = {
    orders: {
      label: t("sales"),
      color: "hsl(var(--primary))",
    },
  };

  const chartData = useMemo(() => {
    if (!mounted) return [];
    const now = new Date();
    const dataMap = new Map<string, { orders: number; revenue: number }>();

    if (period === "24h") {
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 60 * 60 * 1000);
        dataMap.set(`${d.getHours()}:00`, { orders: 0, revenue: 0 });
      }
      filtered.forEach((o) => {
        const d = new Date(o.$createdAt);
        const key = `${d.getHours()}:00`;
        if (dataMap.has(key)) {
          const entry = dataMap.get(key)!;
          entry.orders++;
          entry.revenue += (o.total * 0.975) / 100;
        }
      });
    } else {
      const days = period === "30d" ? 30 : 90;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = `${d.getDate()}.${d.getMonth() + 1}.`;
        dataMap.set(key, { orders: 0, revenue: 0 });
      }
      filtered.forEach((o) => {
        const d = new Date(o.$createdAt);
        const key = `${d.getDate()}.${d.getMonth() + 1}.`;
        if (dataMap.has(key)) {
          const entry = dataMap.get(key)!;
          entry.orders++;
          entry.revenue += (o.total * 0.975) / 100;
        }
      });
    }

    return Array.from(dataMap.entries()).map(([time, data]) => ({
      time,
      orders: data.orders,
      revenue: data.revenue,
    }));
  }, [filtered, period, mounted]);

  const xAxisTicks = useMemo(() => {
    if (chartData.length === 0) return [];
    const numTicks = isMobile ? 4 : 8;
    const ticks = [];
    const step = Math.max(
      1,
      Math.floor((chartData.length - 1) / (numTicks - 1)),
    );

    for (let i = 0; i < numTicks; i++) {
      const idx = chartData.length - 1 - i * step;
      if (idx >= 0) {
        ticks.unshift(chartData[idx].time);
      }
    }
    return ticks;
  }, [chartData, isMobile]);

  return (
    <Card className="h-full flex flex-col print:hidden">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 gap-4">
        <h3 className="text-lg font-semibold">{t("statistics")}</h3>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="default" />}>
            {period === "24h"
              ? t("last24h")
              : period === "30d"
                ? t("last30d")
                : t("last90d")}
            <CaretDown className="ml-1" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setPeriod("24h")}>
              {t("last24h")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPeriod("30d")}>
              {t("last30d")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPeriod("90d")}>
              {t("last90d")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-6 pt-4">
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap gap-12">
            <div className="flex flex-col">
              <div className="text-3xl font-bold">{totalOrders}</div>
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                {t("sales")}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="text-3xl font-bold">
                {formatPrice(Math.round(netRevenue))}
              </div>
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                {t("netRevenue")}
              </div>
            </div>
          </div>
          <OverviewChart
            chartData={chartData}
            chartConfig={chartConfig}
            xAxisTicks={xAxisTicks}
          />
        </div>
      </CardContent>
    </Card>
  );
}




function QrCodeGeneratorCard({
  organization,
  baseUrl,
}: {
  organization: Organization;
  baseUrl: string;
}) {
  const { t } = useTranslation();
  const [qrType, setQrType] = useState<"to-go" | "to-stay">("to-go");
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [newTableInput, setNewTableInput] = useState("");
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [deactivateDialog, setDeactivateDialog] = useState<{ isOpen: boolean; type: "to-go" | "to-stay" | null }>({ isOpen: false, type: null });
  const [deleteTablesDialogOpen, setDeleteTablesDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [optimisticToGo, setOptimisticToGo] = useOptimistic(
    organization.isToGoEnabled ?? false,
  );
  const [optimisticToStay, setOptimisticToStay] = useOptimistic(
    organization.isToStayEnabled ?? false,
  );
  const [optimisticTables, setOptimisticTables] = useOptimistic<string[]>(
    organization.tables || []
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = optimisticTables.indexOf(active.id as string);
      const newIndex = optimisticTables.indexOf(over.id as string);

      const newTables = arrayMove(optimisticTables, oldIndex, newIndex);
      
      startTransition(async () => {
        setOptimisticTables(newTables);
        const result = await updateTablesAction(organization.$id, newTables);
        if (result.error) {
          toast.error(result.error as string);
        }
      });
    }
  };

  const handleToggleFeature = (type: "to-go" | "to-stay", checked: boolean) => {
    if (!checked) {
      setDeactivateDialog({ isOpen: true, type });
      return;
    }
    executeToggleFeature(type, checked);
  };

  const executeToggleFeature = (type: "to-go" | "to-stay", checked: boolean) => {
    startTransition(async () => {
      if (type === "to-go") setOptimisticToGo(checked);
      else setOptimisticToStay(checked);

      const result = await toggleFeatureAction(organization.$id, type, checked);
      if (result.error) {
        toast.error(result.error as string);
      } else {
        toast.success(checked ? t("featureEnabled") : t("featureDisabled"));
      }
    });
  };

  const confirmDeactivate = () => {
    if (!deactivateDialog.type) return;
    executeToggleFeature(deactivateDialog.type, false);
    setDeactivateDialog({ isOpen: false, type: null });
  };

  const handleAddTable = (val: string) => {
    if (!val) {
      setIsAddingTable(false);
      return;
    }
    const currentTables = optimisticTables;
    if (currentTables.includes(val)) {
      toast.error(t("tableExists"));
      setIsAddingTable(false);
      return;
    }
    setNewTableInput("");
    setIsAddingTable(false);
    const updatedTables = [val, ...currentTables];
    startTransition(async () => {
      setOptimisticTables(updatedTables);
      const result = await updateTablesAction(organization.$id, updatedTables);
      if (result.error) {
        toast.error(result.error as string);
        setNewTableInput(val);
      } else {
        setSelectedTables(prev => [val, ...prev]);
      }
    });
  };

  const handleRemoveSelectedTables = () => {
    if (selectedTables.length === 0) return;
    setDeleteTablesDialogOpen(true);
  };

  const confirmRemoveTables = () => {
    setDeleteTablesDialogOpen(false);
    const currentTables = optimisticTables;
    const selectedTablesSet = new Set(selectedTables);
    const updatedTables = currentTables.filter((t) => !selectedTablesSet.has(t));
    startTransition(async () => {
      setOptimisticTables(updatedTables);
      const result = await updateTablesAction(organization.$id, updatedTables);
      if (result.error) toast.error(result.error as string);
      else {
        toast.success(t("tablesDeleted"));
        setSelectedTables([]);
      }
    });
  };

  const toggleTableSelection = (tNum: string) => {
    setSelectedTables((prev) => 
      prev.includes(tNum) ? prev.filter((t) => t !== tNum) : [...prev, tNum]
    );
  };

  const qrUrl =
    qrType === "to-go"
      ? `${baseUrl}/to-go/${organization.$id}`
      : `${baseUrl}/to-stay/${organization.$id}?table=${selectedTables[0] || "1"}`;

  const isActive = qrType === "to-go" ? optimisticToGo : optimisticToStay;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full print:hidden">
        {/* Left Card: QR Code Preview */}
        <Card className="relative flex flex-col items-center justify-end p-6 shadow-sm w-full h-full min-h-[600px] transition-all duration-200 bg-white">
          
          <div className="absolute top-4 left-6 right-4 flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-foreground">{t("qrPreview")}</h3>
            <Button
              onClick={handlePrint}
              variant="default"
              disabled={qrType === "to-stay" && selectedTables.length === 0}
              className="bg-primary text-secondary shadow-sm shrink-0"
            >
              <Printer className="mr-2 h-4 w-4" />
              {qrType === "to-go" 
                ? t("printQrCode") 
                : (selectedTables.length > 1 
                    ? t("printMultipleCodes").replace("{{count}}", selectedTables.length.toString()) 
                    : t("printQrCode"))}
            </Button>
          </div>

          <div className={cn("flex flex-col items-center w-[280px] gap-2 mt-auto pt-14 mb-1 transition-all duration-200", qrType === "to-stay" && selectedTables.length === 0 ? "opacity-50 grayscale" : "")}>
            <div className="text-center w-[84%] mx-auto flex flex-col justify-center gap-1.5 -mb-4">
              <ScaledText 
                text={`${t("qrCodeTitleLine1")} ${t("qrCodeTitleLine2")}`}
                className="text-foreground"
              />
              <p className="text-right w-full text-foreground font-bold text-lg leading-none uppercase">
                {qrType === "to-stay" ? t("qrCodeAt") : t("qrCodeFor")}
              </p>
              <ScaledText 
                text={qrType === "to-stay"
                  ? `${t("table")} ${selectedTables.length > 0 ? selectedTables[0] : "?"}`
                  : t("pickup")}
                className="text-foreground"
              />
            </div>

            <div className="relative bg-white rounded-xl flex items-center justify-center overflow-hidden">
              <StyledQRCode value={qrUrl} size={280} />
            </div>
          </div>
        </Card>

        {/* Right Card: QR Code Management */}
        <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-col gap-3 pb-4 shrink-0">
            {/* Title & Mode Selection Dropdown Row */}
            <div className="flex items-center justify-between gap-4 w-full">
              <h3 className="text-lg font-semibold">{t("qrManagement")}</h3>

              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="default" className="w-auto bg-primary text-secondary shrink-0" />}>
                  {qrType === "to-go" ? t("toGo") : t("toStay")}
                  <CaretDown className="ml-2 h-4 w-4 shrink-0" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setQrType("to-go")}>
                    {t("toGo")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setQrType("to-stay")}>
                    {t("toStay")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Description & Feature Toggle Switch Row */}
            <div className="flex items-center justify-between gap-4 w-full">
              <p className="text-sm text-muted-foreground text-balance leading-relaxed flex-1">
                {qrType === "to-go"
                  ? t("qrCodeAdminDescToGo")
                  : t("qrCodeAdminDescToStay")}
              </p>
              
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={isActive}
                  onCheckedChange={(checked) => handleToggleFeature(qrType, checked)}
                  disabled={isPending}
                />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col min-h-0">
            {qrType === "to-stay" && (
              <div className="flex-1 min-w-0 w-full flex flex-col gap-4 h-full min-h-0">
                <div className="flex flex-row items-center gap-2 w-full">
                  <Button
                    type="button"
                    variant={selectedTables.length === optimisticTables.length && selectedTables.length > 0 ? "default" : "outline"}
                    disabled={optimisticTables.length === 0}
                    onClick={() => {
                      if (optimisticTables.length === 0) return;
                      if (selectedTables.length === optimisticTables.length) {
                        setSelectedTables([]);
                      } else {
                        setSelectedTables(optimisticTables);
                      }
                    }}
                    className={cn(
                      "h-9 px-3 rounded-full gap-2 font-medium text-xs transition-colors",
                      selectedTables.length > 0 ? "flex-1" : "w-full"
                    )}
                  >
                    <SelectionAll
                      className="h-4 w-4 shrink-0"
                      weight="bold"
                    />
                    <span>{t("selectAll")}</span>
                  </Button>

                  {selectedTables.length > 0 && (
                    <Button
                      variant="destructive"
                      onClick={handleRemoveSelectedTables}
                      className="h-9 px-3 rounded-full gap-2 text-xs font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 flex-1 shrink-0"
                    >
                      <Trash className="h-4 w-4 shrink-0" weight="bold" />
                      <span>{selectedTables.length} {t("delete")}</span>
                    </Button>
                  )}
                </div>

                <ScrollArea className="w-full h-[280px]">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={optimisticTables}
                      strategy={rectSortingStrategy}
                    >
                      <div className="grid grid-cols-4 gap-2 pb-4">
                        {isAddingTable ? (
                          <Input
                            autoFocus
                            placeholder="Nr."
                            value={newTableInput}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              if (val.length <= 4) setNewTableInput(val);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleAddTable(newTableInput);
                              } else if (e.key === "Escape") {
                                setIsAddingTable(false);
                                setNewTableInput("");
                              }
                            }}
                            onBlur={() => {
                              if (newTableInput) {
                                handleAddTable(newTableInput);
                              } else {
                                setIsAddingTable(false);
                              }
                            }}
                            maxLength={4}
                            className="h-10 text-center text-sm font-medium border-2 border-dashed border-primary px-2 rounded-md focus-visible:ring-0"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsAddingTable(true)}
                            className="flex items-center justify-center border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-muted/30 rounded-md px-3 py-2 h-10 transition-colors text-center font-medium shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
                            title={t("addTable")}
                          >
                            <Plus className="h-4 w-4" weight="bold" />
                          </button>
                        )}

                        {(() => {
                          const selectedTablesSet = new Set(selectedTables);
                          return optimisticTables.map((tNum) => (
                            <SortableTableItem
                              key={tNum}
                              tNum={tNum}
                              isSelected={selectedTablesSet.has(tNum)}
                              onToggle={() => toggleTableSelection(tNum)}
                            />
                          ));
                        })()}
                      </div>
                    </SortableContext>
                  </DndContext>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="fixed -left-[9999px] top-0 opacity-0 pointer-events-none print:static print:opacity-100 print:pointer-events-auto print:grid print:grid-cols-2 print:gap-y-16 print:gap-x-8 bg-white print:content-start">
        {qrType === "to-stay" ? (
          selectedTables.map((tNum) => {
            const tableQrUrl = `${baseUrl}/to-stay/${organization.$id}?table=${tNum}`;
            return (
              <div key={tNum} className="relative origin-top print-color-adjust-exact break-inside-avoid flex justify-center items-start">
                <Card className="flex flex-col items-center justify-center p-6 bg-white shadow-sm print:shadow-none print:ring-0 print:rounded-none w-max print:border print:border-dashed print:border-black/40">
                    <div className="flex flex-col items-center w-[220px] gap-1.5">
                      <div className="text-center w-[84%] mx-auto flex flex-col justify-center gap-1.5 -mb-4">
                        <ScaledText 
                          text={`${t("qrCodeTitleLine1")} ${t("qrCodeTitleLine2")}`}
                          className="text-foreground"
                        />
                        <p className="text-right w-full text-foreground font-bold text-base leading-none uppercase">
                          {t("qrCodeAt")}
                        </p>
                        <ScaledText 
                          text={`${t("table")} ${tNum}`}
                          className="text-foreground"
                        />
                      </div>
      
                      <div className="relative bg-white rounded-xl flex items-center justify-center overflow-hidden">
                        <StyledQRCode value={tableQrUrl} size={220} />
                      </div>
                    </div>
                </Card>
              </div>
            );
          })
        ) : (
          <div className="relative origin-top print-color-adjust-exact break-inside-avoid flex justify-center items-start">
            <Card className="flex flex-col items-center justify-center p-6 bg-white shadow-sm print:shadow-none print:ring-0 print:rounded-none w-max print:border print:border-dashed print:border-black/40">
                <div className="flex flex-col items-center w-[220px] gap-1.5">
                  <div className="text-center w-[84%] mx-auto flex flex-col justify-center gap-1.5 -mb-4">
                    <ScaledText 
                      text={`${t("qrCodeTitleLine1")} ${t("qrCodeTitleLine2")}`}
                      className="text-foreground"
                    />
                    <p className="text-right w-full text-foreground font-bold text-base leading-none uppercase">
                      {t("qrCodeFor")}
                    </p>
                    <ScaledText 
                      text={t("pickup")}
                      className="text-foreground"
                    />
                  </div>
  
                  <div className="relative bg-white rounded-xl flex items-center justify-center overflow-hidden">
                    <StyledQRCode value={qrUrl} size={220} />
                  </div>
                </div>
            </Card>
          </div>
        )}
      </div>

      <Dialog open={deactivateDialog.isOpen} onOpenChange={(isOpen) => setDeactivateDialog(prev => ({ ...prev, isOpen }))}>
        <DialogContent className="bg-primary text-primary-foreground border-border/20">
          <DialogHeader>
            <DialogTitle>{t("confirmAction")}</DialogTitle>
            <DialogDescription className="text-primary-foreground/80">
              {t("confirmDeactivate")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex w-full gap-3 mt-2">
            <Button variant="outline" onClick={() => setDeactivateDialog({ isOpen: false, type: null })} className="flex-1 bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10 text-primary-foreground hover:text-primary-foreground">
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDeactivate} className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("deactivate")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTablesDialogOpen} onOpenChange={setDeleteTablesDialogOpen}>
        <DialogContent className="bg-primary text-primary-foreground border-border/20">
          <DialogHeader>
            <DialogTitle>{t("confirmAction")}</DialogTitle>
            <DialogDescription className="text-primary-foreground/80">
              {t("confirmDeleteTables")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex w-full gap-3 mt-2">
            <Button variant="outline" onClick={() => setDeleteTablesDialogOpen(false)} className="flex-1 bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10 text-primary-foreground hover:text-primary-foreground">
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmRemoveTables} className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface OverviewContentProps {
  organization: Organization;
  orders: Order[];
}

export function OverviewContent({
  organization,
  orders,
}: OverviewContentProps) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<TimePeriod>("30d");
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const baseUrl =
    mounted && typeof window !== "undefined"
      ? window.location.origin
      : "https://app.zakkig.de";

  return (
    <>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between space-y-2 print:hidden">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("overview")}</h1>
            {organization.address && (
              <p className="text-muted-foreground">
                {organization.address}
              </p>
            )}
          </div>
          <RefreshButton />
        </div>

        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 print:block">
          <StatisticsCard
            orders={orders}
            period={period}
            setPeriod={setPeriod}
            isMobile={isMobile}
            mounted={mounted}
          />
          <QrCodeGeneratorCard organization={organization} baseUrl={baseUrl} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 print:hidden">
          <Link
            href={`/dashboard/${organization.$id}/menu`}
            className="flex items-start gap-3 p-4 bg-background border rounded-xl hover:bg-muted/50 transition-colors shadow-sm"
          >
            <div className="bg-primary text-secondary p-2.5 rounded-full shrink-0">
              <ForkKnife className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-lg leading-none">{t("menu")}</span>
              <span className="text-sm text-muted-foreground leading-relaxed text-balance">
                {t("quickMenuDesc")}
              </span>
            </div>
          </Link>
          <Link
            href={`/dashboard/${organization.$id}/live-orders`}
            className="flex items-start gap-3 p-4 bg-background border rounded-xl hover:bg-muted/50 transition-colors shadow-sm"
          >
            <div className="bg-primary text-secondary p-2.5 rounded-full shrink-0">
              <ClipboardText className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-lg leading-none">{t("orders")}</span>
              <span className="text-sm text-muted-foreground leading-relaxed text-balance">
                {t("quickOrdersDesc")}
              </span>
            </div>
          </Link>
          <Link
            href={`/dashboard/${organization.$id}/archive`}
            className="flex items-start gap-3 p-4 bg-background border rounded-xl hover:bg-muted/50 transition-colors shadow-sm"
          >
            <div className="bg-primary text-secondary p-2.5 rounded-full shrink-0">
              <Archive className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-lg leading-none">{t("archive")}</span>
              <span className="text-sm text-muted-foreground leading-relaxed text-balance">
                {t("quickArchiveDesc")}
              </span>
            </div>
          </Link>
          <Link
            href={`/dashboard/${organization.$id}/settings`}
            className="flex items-start gap-3 p-4 bg-background border rounded-xl hover:bg-muted/50 transition-colors shadow-sm"
          >
            <div className="bg-primary text-secondary p-2.5 rounded-full shrink-0">
              <Gear className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-lg leading-none">{t("settings")}</span>
              <span className="text-sm text-muted-foreground leading-relaxed text-balance">
                {t("quickSettingsDesc")}
              </span>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
