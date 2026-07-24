"use client";

import { useState, useTransition, useCallback } from "react";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CaretDown, CaretUp, SlidersHorizontal } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useTranslation, formatPrice } from "@/lib/i18n";
import { getImagePreviewUrl } from "@/lib/appwrite/client";
import { toggleMenuItemAvailability } from "@/actions/menu-actions";
import type { MenuCategory, MenuItem } from "@/lib/types";

interface AvailabilityContentProps {
  categories: MenuCategory[];
  items: MenuItem[];
}

export function AvailabilityContent({
  categories,
  items: initialItems,
}: AvailabilityContentProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState(initialItems);
  const [isPending, startTransition] = useTransition();

  const handleToggleAvailability = useCallback(
    (itemId: string, available: boolean) => {
      setItems((prevItems) =>
        prevItems.map((i) => (i.$id === itemId ? { ...i, available } : i))
      );
      startTransition(async () => {
        const res = await toggleMenuItemAvailability(itemId, available);
        if (!res.success) {
          // Revert on error
          setItems((prevItems) =>
            prevItems.map((i) => (i.$id === itemId ? { ...i, available: !available } : i))
          );
        }
      });
    },
    []
  );

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto pb-24">
      {categories.map((category) => {
        const categoryItems = items.filter((i) => i.categoryId === category.$id);
        return (
          <CategorySection
            key={category.$id}
            category={category}
            items={categoryItems}
            onToggle={handleToggleAvailability}
          />
        );
      })}

      {categories.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
          <p>Das Menü ist leer.</p>
        </div>
      )}
    </div>
  );
}

function CategorySection({
  category,
  items,
  onToggle,
}: {
  category: MenuCategory;
  items: MenuItem[];
  onToggle: (id: string, available: boolean) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className="shadow-sm border-2 border-transparent hover:border-border transition-colors">
      <CardHeader className="p-4 sm:p-6 pb-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <CaretUp className="h-5 w-5 text-muted-foreground shrink-0" />
            ) : (
              <CaretDown className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
            <h3 className="text-xl font-bold font-sans tracking-tight text-foreground truncate">
              {category.name}
            </h3>
            <Badge variant="secondary" className="font-mono bg-muted/50 text-muted-foreground border-0 hidden sm:inline-flex">
              {items.length} {items.length === 1 ? "Artikel" : "Artikel"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <CardContent className="p-2 sm:p-4 pt-0">
            <div className="flex flex-col gap-2">
              {items.map((item) => (
                <ItemRowView key={item.$id} item={item} onToggle={onToggle} />
              ))}
              {items.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                  Keine Artikel in dieser Kategorie.
                </div>
              )}
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}

function ItemRowView({
  item,
  onToggle,
}: {
  item: MenuItem;
  onToggle: (id: string, available: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded-lg border bg-card text-card-foreground transition-all duration-200",
        !item.available && "opacity-75 grayscale-[0.5] bg-muted/30"
      )}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="relative h-12 w-12 sm:h-16 sm:w-16 rounded-md overflow-hidden shrink-0 bg-muted/50 border shadow-inner">
          {item.imageId ? (
            <Image
              src={getImagePreviewUrl(item.imageId)}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 48px, 64px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
              <Image alt="placeholder" src="/placeholder.svg" fill className="opacity-20 object-cover" />
            </div>
          )}
        </div>

        <div className="flex flex-col flex-1 min-w-0 py-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-base sm:text-lg leading-tight truncate">
              {item.name}
            </h4>
          </div>
          <span className="text-sm font-medium text-muted-foreground mt-1 tabular-nums">
            {formatPrice(item.price)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 mt-2 sm:mt-0">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end px-1 sm:px-0">
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              item.available ? "text-primary" : "text-muted-foreground"
            )}
          >
            {item.available ? t("available") : t("unavailable")}
          </span>
          <Switch
            checked={item.available}
            onCheckedChange={(checked) => onToggle(item.$id, checked)}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </div>
    </div>
  );
}
