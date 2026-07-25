"use client";

import { useState, useTransition, useCallback, useEffect, useMemo } from "react";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CaretDown, CaretUp, SlidersHorizontal } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useTranslation, formatPrice } from "@/lib/i18n";
import { getImagePreviewUrl } from "@/lib/appwrite/client";
import {
  toggleMenuItemAvailability,
  toggleCustomizationAvailabilityAction,
} from "@/actions/menu-actions";
import { RefreshButton } from "@/components/dashboard/refresh-button";
import type { MenuCategory, MenuItem, CustomizationStep } from "@/lib/types";

interface AvailabilityContentProps {
  categories: MenuCategory[];
  items: MenuItem[];
  organizationId?: string;
}

function parseCustomizations(customizations?: string): CustomizationStep[] {
  if (!customizations) return [];
  try {
    const parsed = JSON.parse(customizations);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1400px)");
    setIsDesktop(media.matches);
    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);
  return isDesktop;
}

export function AvailabilityContent({
  categories,
  items: initialItems,
  organizationId,
}: AvailabilityContentProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState(initialItems);
  const [, startTransition] = useTransition();
  const isDesktop = useIsDesktop();

  const { leftCategories, rightCategories } = useMemo(() => {
    const left: MenuCategory[] = [];
    const right: MenuCategory[] = [];
    categories.forEach((cat, i) => {
      if (i % 2 === 0) left.push(cat);
      else right.push(cat);
    });
    return { leftCategories: left, rightCategories: right };
  }, [categories]);

  const handleToggleItem = useCallback(
    (itemId: string, available: boolean) => {
      setItems((prevItems) =>
        prevItems.map((i) => (i.$id === itemId ? { ...i, available } : i))
      );
      startTransition(async () => {
        const res = await toggleMenuItemAvailability(itemId, available, organizationId);
        if (!res.success) {
          // Revert on error
          setItems((prevItems) =>
            prevItems.map((i) => (i.$id === itemId ? { ...i, available: !available } : i))
          );
        }
      });
    },
    [organizationId]
  );

  const handleToggleCustomization = useCallback(
    (itemId: string, stepId: string, optionId: string | null, available: boolean) => {
      setItems((prevItems) =>
        prevItems.map((i) => {
          if (i.$id !== itemId) return i;
          const steps = parseCustomizations(i.customizations);
          const updatedSteps = steps.map((step) => {
            const currentStepId = step.id || (step as any).$id;
            if (currentStepId !== stepId) return step;
            if (!optionId) {
              // Toggle entire step and cascade to all its options automatically
              const updatedOptions = (step.options || []).map((opt) => ({
                ...opt,
                available,
              }));
              return { ...step, available, options: updatedOptions };
            } else {
              // Toggle specific option (only if step is not disabled)
              if (step.available === false && available === true) return step;
              const updatedOptions = (step.options || []).map((opt) => {
                const currentOptId = opt.id || (opt as any).$id;
                return currentOptId === optionId ? { ...opt, available } : opt;
              });
              return { ...step, options: updatedOptions };
            }
          });
          return { ...i, customizations: JSON.stringify(updatedSteps) };
        })
      );
      startTransition(async () => {
        const res = await toggleCustomizationAvailabilityAction(
          itemId,
          stepId,
          optionId,
          available,
          organizationId
        );
        if (!res.success) {
          // Revert on error
          setItems(initialItems);
        }
      });
    },
    [initialItems, organizationId]
  );

  return (
    <div className="flex flex-col gap-6 w-full pb-24">
      {/* Page Header (wie bei allen anderen Dashboard Pages) */}
      <div className="flex items-center justify-between space-y-2 pb-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {t("availability" as any) || "Verfügbarkeit"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton />
        </div>
      </div>

      {/* Categories Grid utilizing horizontal space */}
      <div className="flex flex-col gap-6 w-full">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
            <p>Das Menü ist leer.</p>
          </div>
        ) : isDesktop ? (
          <div className="flex gap-6 items-start w-full">
            {/* Left Column (Even Index: 0, 2, 4...) */}
            <div className="flex flex-col gap-6 flex-1 min-w-0">
              {leftCategories.map((category) => {
                const categoryItems = items.filter((i) => i.categoryId === category.$id);
                return (
                  <CategorySection
                    key={category.$id}
                    category={category}
                    items={categoryItems}
                    onToggleItem={handleToggleItem}
                    onToggleCustomization={handleToggleCustomization}
                  />
                );
              })}
            </div>

            {/* Right Column (Odd Index: 1, 3, 5...) */}
            <div className="flex flex-col gap-6 flex-1 min-w-0">
              {rightCategories.map((category) => {
                const categoryItems = items.filter((i) => i.categoryId === category.$id);
                return (
                  <CategorySection
                    key={category.$id}
                    category={category}
                    items={categoryItems}
                    onToggleItem={handleToggleItem}
                    onToggleCustomization={handleToggleCustomization}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 w-full">
            {categories.map((category) => {
              const categoryItems = items.filter((i) => i.categoryId === category.$id);
              return (
                <CategorySection
                  key={category.$id}
                  category={category}
                  items={categoryItems}
                  onToggleItem={handleToggleItem}
                  onToggleCustomization={handleToggleCustomization}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CategorySection({
  category,
  items,
  onToggleItem,
  onToggleCustomization,
}: {
  category: MenuCategory;
  items: MenuItem[];
  onToggleItem: (id: string, available: boolean) => void;
  onToggleCustomization: (itemId: string, stepId: string, optionId: string | null, available: boolean) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className="transition-colors">
      <CardHeader className="flex flex-row items-center justify-between pb-2 gap-4 w-full">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            className="text-lg font-semibold text-foreground text-left bg-transparent border-0 p-0 cursor-pointer min-w-0 flex-1 break-words"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {category.name}
          </button>
          <Badge className="bg-primary text-secondary font-semibold text-xs shrink-0">
            {items.length}
          </Badge>
        </div>

        <div className="flex items-center justify-end gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-full text-muted-foreground hover:text-foreground shrink-0"
            title={isExpanded ? "Einklappen" : "Aufklappen"}
          >
            {isExpanded ? (
              <CaretUp className="h-4 w-4" weight="bold" />
            ) : (
              <CaretDown className="h-4 w-4" weight="bold" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 p-3 sm:p-4 sm:pt-0">
          <div className="flex flex-col gap-2.5 p-1.5 rounded-lg">
            {items.length === 0 ? (
              <div className="py-6 text-center flex flex-col items-center justify-center gap-1 border border-dashed rounded-lg bg-muted/10">
                <p className="text-sm font-medium text-muted-foreground">
                  Keine Artikel in dieser Kategorie.
                </p>
              </div>
            ) : (
              <ItemsMasonryGrid
                items={items}
                onToggleItem={onToggleItem}
                onToggleCustomization={onToggleCustomization}
              />
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function ItemsMasonryGrid({
  items,
  onToggleItem,
  onToggleCustomization,
}: {
  items: MenuItem[];
  onToggleItem: (id: string, available: boolean) => void;
  onToggleCustomization: (itemId: string, stepId: string, optionId: string | null, available: boolean) => void;
}) {
  const renderCard = (item: MenuItem) => (
    <ItemCardView
      key={item.$id}
      item={item}
      onToggleItem={onToggleItem}
      onToggleCustomization={onToggleCustomization}
    />
  );

  return (
    <>
      {/* 1 Column (Mobile < md) */}
      <div className="flex flex-col gap-3 md:hidden">
        {items.map(renderCard)}
      </div>

      {/* 2 Columns (Tablet md to < xl) */}
      <div className="hidden md:grid xl:hidden grid-cols-2 gap-3 sm:gap-4 items-start">
        <div className="flex flex-col gap-3 sm:gap-4">
          {items.filter((_, i) => i % 2 === 0).map(renderCard)}
        </div>
        <div className="flex flex-col gap-3 sm:gap-4">
          {items.filter((_, i) => i % 2 === 1).map(renderCard)}
        </div>
      </div>

      {/* 3 Columns (Desktop xl to < 2xl) */}
      <div className="hidden xl:grid 2xl:hidden grid-cols-3 gap-4 items-start">
        <div className="flex flex-col gap-4">
          {items.filter((_, i) => i % 3 === 0).map(renderCard)}
        </div>
        <div className="flex flex-col gap-4">
          {items.filter((_, i) => i % 3 === 1).map(renderCard)}
        </div>
        <div className="flex flex-col gap-4">
          {items.filter((_, i) => i % 3 === 2).map(renderCard)}
        </div>
      </div>

      {/* 4 Columns (Large Desktop >= 2xl) */}
      <div className="hidden 2xl:grid grid-cols-4 gap-4 items-start">
        <div className="flex flex-col gap-4">
          {items.filter((_, i) => i % 4 === 0).map(renderCard)}
        </div>
        <div className="flex flex-col gap-4">
          {items.filter((_, i) => i % 4 === 1).map(renderCard)}
        </div>
        <div className="flex flex-col gap-4">
          {items.filter((_, i) => i % 4 === 2).map(renderCard)}
        </div>
        <div className="flex flex-col gap-4">
          {items.filter((_, i) => i % 4 === 3).map(renderCard)}
        </div>
      </div>
    </>
  );
}

function ItemCardView({
  item,
  onToggleItem,
  onToggleCustomization,
}: {
  item: MenuItem;
  onToggleItem: (id: string, available: boolean) => void;
  onToggleCustomization: (itemId: string, stepId: string, optionId: string | null, available: boolean) => void;
}) {
  const steps = parseCustomizations(item.customizations);
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="flex flex-col rounded-xl border bg-background p-3 gap-3">
      {/* Main Content Area */}
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {item.imageId && (
            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-border/40 shrink-0 bg-muted flex items-center justify-center shadow-xs">
              <Image
                src={getImagePreviewUrl(item.imageId)}
                alt={item.name}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
          )}

          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-base text-foreground break-words">{item.name}</span>
              {steps.length > 0 && (
                <Badge variant="outline" className="text-xs gap-1 border-primary/40 text-primary bg-primary/5 shrink-0">
                  <SlidersHorizontal className="w-3 h-3" weight="bold" />
                  {steps.length} {steps.length === 1 ? "Schritt" : "Schritte"}
                </Badge>
              )}
            </div>
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            )}
            <span className="text-sm font-bold text-foreground">
              {formatPrice(item.price)}
            </span>
          </div>
        </div>

        {/* Main Item Switch */}
        <div className="flex items-center shrink-0 pt-0.5">
          <Switch
            checked={item.available}
            onCheckedChange={(checked) => onToggleItem(item.$id, checked)}
            title={item.available ? "Artikel verfügbar" : "Artikel ausverkauft"}
          />
        </div>
      </div>

      {/* Customizations Section */}
      {steps.length > 0 && (
        <div className="pt-2 border-t border-border/40">
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className="flex items-center justify-between w-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            <span>Zusammenstellung</span>
            {showOptions ? <CaretUp className="h-3.5 w-3.5" weight="bold" /> : <CaretDown className="h-3.5 w-3.5" weight="bold" />}
          </button>

          {showOptions && (
            <div className="mt-2 space-y-3 bg-muted/20 p-2.5 rounded-lg border border-border/40">
              {steps.map((step, sIdx) => {
                const stepId = step.id || (step as any).$id || `step-${sIdx}`;
                const stepAvailable = step.available !== false;
                return (
                  <div key={stepId} className="space-y-2">
                    {/* Step Header Row */}
                    <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-border/40">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {step.name}
                      </span>
                      <div className="flex items-center shrink-0">
                        <Switch
                          checked={stepAvailable}
                          onCheckedChange={(checked) => onToggleCustomization(item.$id, stepId, null, checked)}
                          title="Schritt Verfügbarkeit umschalten"
                        />
                      </div>
                    </div>

                    {/* Options List */}
                    <div className="pl-2 space-y-1 border-l-2 border-primary/20">
                      {(step.options || []).map((opt, oIdx) => {
                        const optId = opt.id || (opt as any).$id || `opt-${oIdx}`;
                        const optAvailable = opt.available !== false && stepAvailable;
                        return (
                          <div
                            key={optId}
                            className="flex items-center justify-between gap-2 text-xs py-1 px-1.5 rounded transition-colors hover:bg-muted/40"
                          >
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <span className="font-medium text-foreground truncate">
                                {opt.name}
                              </span>
                              {opt.extraPrice > 0 && (
                                <span className="text-muted-foreground shrink-0 font-medium">
                                  (+{formatPrice(opt.extraPrice)})
                                </span>
                              )}
                            </div>

                            <div className="flex items-center shrink-0">
                              <Switch
                                checked={opt.available !== false}
                                disabled={!stepAvailable}
                                onCheckedChange={(checked) => onToggleCustomization(item.$id, stepId, optId, checked)}
                                title="Option Verfügbarkeit umschalten"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
