"use client";

import {
  useState,
  useEffect,
  useTransition,
  useRef,
  memo,
  useMemo,
  useCallback,
} from "react";
import {
  DndContext,
  closestCenter,
  rectIntersection,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  type CollisionDetection,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  PencilSimple,
  Trash,
  Eye,
  EyeSlash,
  DotsSixVertical,
  SlidersHorizontal,
  CaretDown,
  CaretUp,
  Check,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ItemWorkspace } from "./menu/item-workspace";

import Image from "next/image";
import { useTranslation, formatPrice } from "@/lib/i18n";
import { getImagePreviewUrl } from "@/lib/convex/client";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  deleteMenuItemAction,
  toggleMenuItemAvailability,
  reorderCategoriesAction,
  reorderItemsAction,
} from "@/actions/menu-actions";
import type { MenuCategory, MenuItem, CustomizationStep } from "@/lib/types";

interface MenuContentProps {
  categories: MenuCategory[];
  items: MenuItem[];
  organizationId: string;
}

const EMPTY_ITEMS: MenuItem[] = [];

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

const customItemCollisionDetection: CollisionDetection = (args) => {
  // Use pointerWithin so collisions ONLY trigger when pointer enters a specific item's box.
  // This eliminates cascade movement / twitching on unrelated items below.
  const pointerCollisions = pointerWithin(args);
  const itemCollision = pointerCollisions.find(
    (c) => c.data?.current?.type === "item",
  );

  if (itemCollision) {
    return [itemCollision];
  }

  const categoryCollision = pointerCollisions.find(
    (c) => c.data?.current?.type === "category",
  );
  if (categoryCollision) {
    return [categoryCollision];
  }

  return rectIntersection(args);
};

export function MenuContent({
  categories: initialCategories,
  items: initialItems,
  organizationId,
}: MenuContentProps) {
  const { t } = useTranslation();
  const [, startTransition] = useTransition();
  const isDesktop = useIsDesktop();

  // Persistent client state for categories and items to eliminate drag & drop flickering
  const [categories, setCategories] = useState<MenuCategory[]>(() => 
    Array.from(new Map(initialCategories.map(c => [c.$id, c])).values())
  );
  const [items, setItems] = useState<MenuItem[]>(() =>
    Array.from(new Map(initialItems.map(i => [i.$id, i])).values())
  );


  useEffect(() => {
    setCategories(Array.from(new Map(initialCategories.map(c => [c.$id, c])).values()));
    setItems(Array.from(new Map(initialItems.map(i => [i.$id, i])).values()));
  }, [initialCategories, initialItems]);

  // Dialog & Sheet states
  const [showItemSheet, setShowItemSheet] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [autoEditCategoryId, setAutoEditCategoryId] = useState<string | null>(
    null,
  );
  const isCreatingCategoryRef = useRef(false);

  // Collapsed categories state (map of categoryId -> isCollapsed)
  const [collapsedCategories, setCollapsedCategories] = useState<
    Record<string, boolean>
  >({});

  // Delete alert dialog state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "category" | "item";
    id: string;
    name: string;
    imageId?: string;
  } | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Memoized items mapped by category ID for zero-alloc prop stability
  const itemsByCategory = useMemo(() => {
    const map: Record<string, MenuItem[]> = {};
    categories.forEach((cat) => {
      map[cat.$id] = [];
    });
    items.forEach((item) => {
      if (map[item.categoryId]) {
        map[item.categoryId].push(item);
      } else {
        map[item.categoryId] = [item];
      }
    });
    return map;
  }, [categories, items]);

  // Partition categories for masonry-like two column layout
  const { leftCategories, rightCategories } = useMemo(() => {
    const left: MenuCategory[] = [];
    const right: MenuCategory[] = [];
    categories.forEach((cat, i) => {
      if (i % 2 === 0) left.push(cat);
      else right.push(cat);
    });
    return { leftCategories: left, rightCategories: right };
  }, [categories]);

  // Active item or category for drag preview overlay
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<MenuCategory | null>(
    null,
  );

  const initialItemsRef = useRef<MenuItem[]>([]);

  // Handle Drag Start
  const handleDragStart = (event: DragStartEvent) => {
    const type = event.active.data.current?.type;
    if (type === "item") {
      initialItemsRef.current = items;
      const item = items.find((i) => i.$id === event.active.id);
      if (item) setActiveItem(item);
    } else if (type === "category") {
      const cat = categories.find((c) => c.$id === event.active.id);
      if (cat) setActiveCategory(cat);
    }
  };

  // Handle Drag Cancel
  const handleDragCancel = () => {
    setActiveItem(null);
    setActiveCategory(null);
    if (initialItemsRef.current.length > 0) {
      setItems(initialItemsRef.current);
    }
  };

  // Handle Drag Over (live move only across different categories)
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.data.current?.type !== "item") return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const overType = over.data.current?.type;

    // Only reorder live if hovering over another visible ITEM in a DIFFERENT category.
    // Intra-category sorting is handled automatically by @dnd-kit SortableContext transforms.
    if (overType !== "item") return;

    const overCategoryId = over.data.current?.item?.categoryId;
    if (!overCategoryId) return;

    setItems((prevItems) => {
      const activeIdx = prevItems.findIndex((i) => i.$id === activeId);
      if (activeIdx === -1) return prevItems;

      const activeItem = prevItems[activeIdx];
      const currentCatId = activeItem.categoryId;
      const overIdx = prevItems.findIndex((i) => i.$id === overId);
      if (overIdx === -1) return prevItems;

      // Cross-category item hover: move item to target category's SortableContext
      if (currentCatId !== overCategoryId) {
        const updated = [...prevItems];
        updated[activeIdx] = {
          ...updated[activeIdx],
          categoryId: overCategoryId,
        };
        return arrayMove(updated, activeIdx, overIdx);
      }

      // Intra-category sorting: update items array live so SortableContext smoothly animates position swap
      if (activeIdx !== overIdx) {
        return arrayMove(prevItems, activeIdx, overIdx);
      }

      return prevItems;
    });
  };

  // Handle Drag End (persist final category or item positions to Convex)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);
    setActiveCategory(null);

    if (!over) return;

    const activeType = active.data.current?.type;

    if (activeType === "category") {
      if (active.id !== over.id) {
        const oldIndex = categories.findIndex((c) => c.$id === active.id);
        const newIndex = categories.findIndex((c) => c.$id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          const previousCategories = [...categories];
          const newCategories = arrayMove(categories, oldIndex, newIndex);
          setCategories(newCategories);

          startTransition(async () => {
            const res = await reorderCategoriesAction(
              organizationId,
              newCategories.map((c) => c.$id),
            );
            if (res?.error) {
              toast.error(res.error);
              setCategories(previousCategories);
            }
          });
        }
      }
      return;
    }

    if (activeType === "item") {
      const activeId = active.id as string;
      const overId = over.id as string;
      const overType = over.data.current?.type;
      const overCategoryId =
        overType === "category"
          ? over.data.current?.category?.$id || overId
          : undefined;

      let currentItems = [...items];

      // 1. Intra-category item drop or inter-item drop
      if (overType === "item" && activeId !== overId) {
        const oldIndex = currentItems.findIndex((i) => i.$id === activeId);
        const newIndex = currentItems.findIndex((i) => i.$id === overId);
        if (oldIndex !== -1 && newIndex !== -1) {
          currentItems = arrayMove(currentItems, oldIndex, newIndex);
          setItems(currentItems);
        }
      }
      // 2. Drop onto category card directly (e.g. collapsed or empty category)
      else if (overType === "category" && overCategoryId) {
        const activeIdx = currentItems.findIndex((i) => i.$id === activeId);
        if (
          activeIdx !== -1 &&
          currentItems[activeIdx].categoryId !== overCategoryId
        ) {
          const catItems = currentItems.filter(
            (i) => i.categoryId === overCategoryId,
          );
          const lastCatItem =
            catItems.length > 0 ? catItems[catItems.length - 1] : null;
          const overIdx = lastCatItem
            ? currentItems.findIndex((i) => i.$id === lastCatItem.$id) + 1
            : currentItems.length;

          currentItems[activeIdx] = {
            ...currentItems[activeIdx],
            categoryId: overCategoryId,
          };
          currentItems = arrayMove(currentItems, activeIdx, overIdx);
          setItems(currentItems);
        }
      }

      const updates: { id: string; sortOrder: number; categoryId: string }[] =
        [];
      categories.forEach((cat) => {
        const catItems = currentItems.filter((i) => i.categoryId === cat.$id);
        catItems.forEach((item, idx) => {
          updates.push({
            id: item.$id,
            sortOrder: idx,
            categoryId: cat.$id,
          });
        });
      });

      if (updates.length > 0) {
        startTransition(async () => {
          const res = await reorderItemsAction(organizationId, updates);
          if (res?.error) {
            toast.error(res.error);
          }
        });
      }
    }
  };

  // In-place category creation handler
  async function openNewCategory() {
    if (isCreatingCategoryRef.current) return;
    isCreatingCategoryRef.current = true;

    const tempId = `temp-${Date.now()}`;
    const defaultName = t("newCategory");
    const newSortOrder = categories.length;

    const tempCategory: MenuCategory = {
      _id: tempId as any,
      _creationTime: Date.now(),
      $id: tempId,
      organizationId,
      name: defaultName,
      sortOrder: newSortOrder,
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      $permissions: [],
      $databaseId: "",
      $collectionId: "",
    };

    setCategories((prev) => [...prev, tempCategory]);
    setCollapsedCategories((prev) => ({ ...prev, [tempId]: false }));
    setAutoEditCategoryId(tempId);

    const formData = new FormData();
    formData.append("organizationId", organizationId);
    formData.append("name", defaultName);
    formData.append("sortOrder", newSortOrder.toString());

    try {
      const res = await createCategoryAction({}, formData);
      if (res?.error) {
        toast.error(res.error);
        setCategories((prev) => prev.filter((c) => c.$id !== tempId));
        setAutoEditCategoryId(null);
      } else if (res?.categoryId) {
        const realId = res.categoryId;
        setCategories((prev) =>
          prev.map((c) => (c.$id === tempId ? { ...c, $id: realId } : c)),
        );
        setCollapsedCategories((prev) => {
          const next = { ...prev };
          delete next[tempId];
          next[realId] = false;
          return next;
        });
        setAutoEditCategoryId(realId);
      }
    } finally {
      isCreatingCategoryRef.current = false;
    }
  }

  const openNewItem = useCallback((categoryId: string) => {
    setEditingItem(null);
    setSelectedCategoryId(categoryId);
    setShowItemSheet(true);
  }, []);

  const openEditItem = useCallback((item: MenuItem) => {
    setEditingItem(item);
    setSelectedCategoryId(item.categoryId);
    setShowItemSheet(true);
  }, []);

  const toggleCategoryCollapse = useCallback((categoryId: string) => {
    setCollapsedCategories((prev) => {
      const isCurrentlyCollapsed = prev[categoryId] ?? true;
      return {
        ...prev,
        [categoryId]: !isCurrentlyCollapsed,
      };
    });
  }, []);

  const handleEditComplete = useCallback(() => {
    setAutoEditCategoryId(null);
  }, []);

  const handleDeleteCategory = useCallback((category: MenuCategory) => {
    setDeleteConfirm({
      type: "category",
      id: category.$id,
      name: category.name,
    });
  }, []);

  const handleDeleteItem = useCallback((item: MenuItem) => {
    setDeleteConfirm({
      type: "item",
      id: item.$id,
      name: item.name,
      imageId: item.imageId,
    });
  }, []);

  // Delete Action Confirmations
  async function confirmDelete() {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "category") {
      const res = await deleteCategoryAction(deleteConfirm.id, organizationId);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(t("categoryDeleted"));
      }
    } else if (deleteConfirm.type === "item") {
      const res = await deleteMenuItemAction(
        deleteConfirm.id,
        organizationId,
        deleteConfirm.imageId,
      );
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(t("itemDeleted"));
      }
    }
    setDeleteConfirm(null);
  }

  const handleToggleAvailability = useCallback(
    (itemId: string, available: boolean) => {
      setItems((prevItems) =>
        prevItems.map((i) => (i.$id === itemId ? { ...i, available } : i)),
      );
      startTransition(async () => {
        const res = await toggleMenuItemAvailability(
          itemId,
          available,
          organizationId,
        );
        if (res?.error) {
          toast.error(res.error);
          // Rollback optimistic update
          setItems((prevItems) =>
            prevItems.map((i) =>
              i.$id === itemId ? { ...i, available: !available } : i,
            ),
          );
        }
      });
    },
    [organizationId],
  );

  return (
    <div className="flex-1 space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between space-y-2 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("menu")}</h1>
        </div>
      </div>

      {/* Categories Cards View */}
      {categories.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-foreground">
              {t("noCategories")}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {t("noCategoriesHint")}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={openNewCategory}
            className="border border-dashed border-muted-foreground/40 hover:border-primary font-semibold text-sm text-muted-foreground hover:text-primary hover:bg-primary/10 gap-2 transition-colors cursor-pointer mt-2"
          >
            <Plus className="h-4 w-4 shrink-0" weight="bold" />
            <span>{t("addCategory")}</span>
          </Button>
        </div>
      ) : (
        <DndContext
          id="menu-dnd-context"
          sensors={sensors}
          collisionDetection={customItemCollisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={categories.map((c) => c.$id)}
            strategy={rectSortingStrategy}
          >
            {isDesktop ? (
              <div className="flex gap-6 items-start w-full">
                {/* Left Column (Even Index: 0, 2, 4...) */}
                <div className="flex flex-col gap-6 flex-1 min-w-0">
                  {leftCategories.map((category) => (
                    <SortableCategoryCard
                      key={category.$id}
                      category={category}
                      categoryItems={
                        itemsByCategory[category.$id] || EMPTY_ITEMS
                      }
                      isCollapsed={collapsedCategories[category.$id] ?? true}
                      autoEditName={autoEditCategoryId === category.$id}
                      onEditComplete={handleEditComplete}
                      onToggleCollapse={toggleCategoryCollapse}
                      onDeleteCategory={handleDeleteCategory}
                      onNewItem={openNewItem}
                      onEditItem={openEditItem}
                      onDeleteItem={handleDeleteItem}
                      onToggleAvailability={handleToggleAvailability}
                    />
                  ))}
                  {categories.length % 2 === 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={openNewCategory}
                      className="w-full border border-dashed border-muted-foreground/40 hover:border-primary font-semibold text-sm text-muted-foreground hover:text-primary hover:bg-primary/10 gap-2 transition-colors cursor-pointer"
                    >
                      <Plus className="h-4 w-4 shrink-0" weight="bold" />
                      <span>{t("addCategory")}</span>
                    </Button>
                  )}
                </div>

                {/* Right Column (Odd Index: 1, 3, 5...) */}
                <div className="flex flex-col gap-6 flex-1 min-w-0">
                  {rightCategories.map((category) => (
                    <SortableCategoryCard
                      key={category.$id}
                      category={category}
                      categoryItems={
                        itemsByCategory[category.$id] || EMPTY_ITEMS
                      }
                      isCollapsed={collapsedCategories[category.$id] ?? true}
                      autoEditName={autoEditCategoryId === category.$id}
                      onEditComplete={handleEditComplete}
                      onToggleCollapse={toggleCategoryCollapse}
                      onDeleteCategory={handleDeleteCategory}
                      onNewItem={openNewItem}
                      onEditItem={openEditItem}
                      onDeleteItem={handleDeleteItem}
                      onToggleAvailability={handleToggleAvailability}
                    />
                  ))}
                  {categories.length % 2 === 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={openNewCategory}
                      className="w-full border border-dashed border-muted-foreground/40 hover:border-primary font-semibold text-sm text-muted-foreground hover:text-primary hover:bg-primary/10 gap-2 transition-colors cursor-pointer"
                    >
                      <Plus className="h-4 w-4 shrink-0" weight="bold" />
                      <span>{t("addCategory")}</span>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              /* Mobile Layout (Single Column) */
              <div className="flex flex-col gap-6 w-full">
                {categories.map((category) => (
                  <SortableCategoryCard
                    key={category.$id}
                    category={category}
                    categoryItems={itemsByCategory[category.$id] || EMPTY_ITEMS}
                    isCollapsed={collapsedCategories[category.$id] ?? true}
                    autoEditName={autoEditCategoryId === category.$id}
                    onEditComplete={handleEditComplete}
                    onToggleCollapse={toggleCategoryCollapse}
                    onDeleteCategory={handleDeleteCategory}
                    onNewItem={openNewItem}
                    onEditItem={openEditItem}
                    onDeleteItem={handleDeleteItem}
                    onToggleAvailability={handleToggleAvailability}
                  />
                ))}

                <Button
                  type="button"
                  variant="ghost"
                  onClick={openNewCategory}
                  className="w-full border border-dashed border-muted-foreground/40 hover:border-primary font-semibold text-sm text-muted-foreground hover:text-primary hover:bg-primary/10 gap-2 transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4 shrink-0" weight="bold" />
                  <span>{t("addCategory")}</span>
                </Button>
              </div>
            )}
          </SortableContext>

          <DragOverlay
            dropAnimation={{
              duration: 150,
              easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {activeItem ? (
              <div className="opacity-95 shadow-2xl scale-[1.02] border-2 border-primary rounded-xl overflow-hidden bg-background">
                <ItemRowView
                  item={activeItem}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onToggleAvailability={() => {}}
                />
              </div>
            ) : activeCategory ? (
              <Card className="opacity-95 shadow-2xl scale-[1.02] border-2 border-primary rounded-xl overflow-hidden bg-background">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 gap-2 sm:gap-4 w-full">
                  <div className="flex items-center gap-3 min-w-0 flex-1 w-full">
                    <button
                      type="button"
                      className="cursor-grabbing p-1 rounded text-muted-foreground transition-colors touch-none shrink-0"
                      aria-label={t("reorder")}
                      title={t("reorder")}
                    >
                      <DotsSixVertical className="h-5 w-5" weight="bold" />
                    </button>
                    <div className="text-lg font-semibold text-foreground text-left bg-transparent border-0 p-0 min-w-0 flex-1 break-words">
                      {activeCategory.name}
                    </div>
                    <Badge className="bg-primary text-secondary font-semibold text-xs shrink-0 ml-auto sm:ml-0">
                      {itemsByCategory[activeCategory.$id]?.length || 0}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 pointer-events-none border-t border-border/40 pt-2 sm:pt-0 sm:border-t-0 w-full sm:w-auto">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full text-muted-foreground shrink-0"
                    >
                      <CaretDown className="h-4 w-4" weight="bold" />
                    </Button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-muted-foreground shrink-0"
                      >
                        <PencilSimple className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="default"
                        className="gap-2 font-medium border-border text-foreground shrink-0 opacity-50"
                      >
                        <Trash className="h-4 w-4 shrink-0" weight="bold" />
                        <span>{t("delete")}</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Item Create/Edit Dual-Pane Workspace */}
      <ItemWorkspace
        open={showItemSheet}
        onOpenChange={setShowItemSheet}
        editingItem={editingItem}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        organizationId={organizationId}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="bg-primary text-primary-foreground border-border/20 sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="text-primary-foreground text-lg font-bold">
              {deleteConfirm?.type === "category"
                ? t("confirmDeleteCategoryTitle", {
                    name: deleteConfirm?.name || "",
                  })
                : t("confirmDeleteItemTitle", {
                    name: deleteConfirm?.name || "",
                  })}
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 text-sm leading-relaxed mt-1">
              {deleteConfirm?.type === "category"
                ? t("confirmDeleteCategoryDesc", {
                    name: deleteConfirm?.name || "",
                  })
                : t("confirmDeleteItemDesc", {
                    name: deleteConfirm?.name || "",
                  })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex w-full gap-3 mt-3">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10 text-primary-foreground hover:text-primary-foreground"
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2 font-semibold"
            >
              <Trash className="h-4 w-4 shrink-0" weight="bold" />
              <span>{t("delete")}</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
// Sortable Category Card

interface SortableCategoryCardProps {
  category: MenuCategory;
  categoryItems: MenuItem[];
  isCollapsed: boolean;
  autoEditName?: boolean;
  onEditComplete?: () => void;
  onToggleCollapse: (categoryId: string) => void;
  onDeleteCategory: (category: MenuCategory) => void;
  onNewItem: (categoryId: string) => void;
  onEditItem: (item: MenuItem) => void;
  onDeleteItem: (item: MenuItem) => void;
  onToggleAvailability: (itemId: string, available: boolean) => void;
}

const SortableCategoryCard = memo(function SortableCategoryCard({
  category,
  categoryItems,
  isCollapsed,
  autoEditName = false,
  onEditComplete,
  onToggleCollapse,
  onDeleteCategory,
  onNewItem,
  onEditItem,
  onDeleteItem,
  onToggleAvailability,
}: SortableCategoryCardProps) {
  const { t } = useTranslation();
  const [isEditingName, setIsEditingName] = useState(autoEditName);
  const [nameVal, setNameVal] = useState(category.name);
  const [isSavingName, setIsSavingName] = useState(false);

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: category.$id,
    data: { type: "category", category },
  });

  const { active } = useDndContext();
  const isDraggingItem = active?.data.current?.type === "item";

  // Sync nameVal when category.name changes (render-time update)
  const [prevCategoryName, setPrevCategoryName] = useState(category.name);
  if (category.name !== prevCategoryName) {
    setPrevCategoryName(category.name);
    setNameVal(category.name);
  }

  // Sync isEditingName when autoEditName changes (render-time update)
  const [prevAutoEditName, setPrevAutoEditName] = useState(autoEditName);
  if (autoEditName !== prevAutoEditName) {
    setPrevAutoEditName(autoEditName);
    if (autoEditName) {
      setIsEditingName(true);
    }
  }

  const handleSaveName = async () => {
    onEditComplete?.();
    const trimmed = nameVal.trim();
    if (!trimmed || trimmed === category.name) {
      setNameVal(category.name);
      setIsEditingName(false);
      return;
    }
    if (trimmed.length > 100) {
      toast.error(t("nameTooLong"));
      return;
    }
    setIsSavingName(true);
    const formData = new FormData();
    formData.append("categoryId", category.$id);
    formData.append("organizationId", category.organizationId);
    formData.append("name", trimmed);
    formData.append("sortOrder", category.sortOrder.toString());

    try {
      const res = await updateCategoryAction({}, formData);
      if (res?.error) {
        toast.error(res.error);
        setNameVal(category.name);
      }
    } finally {
      setIsSavingName(false);
      setIsEditingName(false);
    }
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.$id, data: { type: "category", category } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        ref={setDroppableRef}
        className={cn(
          "transition-colors",
          isOver &&
            isDraggingItem &&
            (isCollapsed || categoryItems.length === 0) &&
            "ring-2 ring-primary bg-primary/5",
        )}
      >
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 gap-2 sm:gap-4 w-full">
          <div className="flex items-center gap-3 min-w-0 flex-1 w-full">
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted text-muted-foreground transition-colors touch-none shrink-0"
              title={t("reorderCategories" as any)}
            >
              <DotsSixVertical className="h-5 w-5" weight="bold" />
            </button>
            {isEditingName ? (
              <div className="flex items-center gap-1.5 flex-1 max-w-xs">
                <Input
                  value={nameVal}
                  onChange={(e) => setNameVal(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") {
                      onEditComplete?.();
                      setNameVal(category.name);
                      setIsEditingName(false);
                    }
                  }}
                  autoFocus
                  maxLength={100}
                  disabled={isSavingName}
                  className="h-8 text-lg font-semibold px-2 py-0"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleSaveName}
                  disabled={isSavingName}
                  className="h-8 w-8 text-primary hover:text-primary shrink-0"
                  title={t("save")}
                >
                  <Check className="h-4 w-4" weight="bold" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className="text-lg font-semibold text-foreground text-left bg-transparent border-0 p-0 cursor-pointer min-w-0 flex-1 break-words"
                onClick={() => onToggleCollapse(category.$id)}
              >
                {category.name}
              </button>
            )}
            {!isEditingName && (
              <Badge className="bg-primary text-secondary font-semibold text-xs shrink-0 ml-auto sm:ml-0">
                {categoryItems.length}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 border-t border-border/40 pt-2 sm:pt-0 sm:border-t-0 w-full sm:w-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleCollapse(category.$id)}
              className="rounded-full text-muted-foreground hover:text-foreground shrink-0"
              title={isCollapsed ? "Aufklappen" : "Einklappen"}
            >
              {isCollapsed ? (
                <CaretDown className="h-4 w-4" weight="bold" />
              ) : (
                <CaretUp className="h-4 w-4" weight="bold" />
              )}
            </Button>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (isEditingName) {
                    handleSaveName();
                  } else {
                    setIsEditingName(true);
                  }
                }}
                className="rounded-full text-muted-foreground hover:text-foreground shrink-0"
                title="Kategoriename bearbeiten"
              >
                <PencilSimple className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={() => onDeleteCategory(category)}
                className="gap-2 font-medium border-border text-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors shrink-0"
                title={t("delete")}
              >
                <Trash className="h-4 w-4 shrink-0" weight="bold" />
                <span>{t("delete")}</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isCollapsed && (
          <CardContent className="pt-2 flex flex-col gap-3">
            <SortableContext
              items={categoryItems.map((i) => i.$id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2.5 min-h-[60px] p-1.5 transition-colors rounded-lg">
                {categoryItems.length === 0 ? (
                  <div className="py-6 text-center flex flex-col items-center justify-center gap-1 border border-dashed rounded-lg bg-muted/10">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("noItems")}
                    </p>
                  </div>
                ) : (
                  categoryItems.map((item) => (
                    <SortableItemRow
                      key={item.$id}
                      item={item}
                      onEdit={onEditItem}
                      onDelete={onDeleteItem}
                      onToggleAvailability={onToggleAvailability}
                    />
                  ))
                )}
              </div>
            </SortableContext>

            <Button
              type="button"
              variant="ghost"
              onClick={() => onNewItem(category.$id)}
              className="w-full border border-dashed border-muted-foreground/40 hover:border-primary font-semibold text-sm text-muted-foreground hover:text-primary hover:bg-primary/10 gap-2 transition-colors"
            >
              <Plus className="h-4 w-4 shrink-0" weight="bold" />
              <span>{t("addItem")}</span>
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
});
// Sortable Item Row

interface ItemRowViewProps {
  item: MenuItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAvailability: (available: boolean) => void;
  attributes?: Record<string, any>;
  listeners?: Record<string, any>;
  isDragging?: boolean;
  style?: React.CSSProperties;
  setNodeRef?: (node: HTMLElement | null) => void;
}

const ItemRowView = memo(function ItemRowView({
  item,
  onEdit,
  onDelete,
  onToggleAvailability,
  attributes,
  listeners,
  isDragging,
  style,
  setNodeRef,
}: ItemRowViewProps) {
  const { t } = useTranslation();

  // Parse customization step count
  let customizationStepCount = 0;
  try {
    const parsed: CustomizationStep[] = JSON.parse(item.customizations || "[]");
    if (Array.isArray(parsed)) customizationStepCount = parsed.length;
  } catch {}

  const imageUrl = useMemo(
    () => (item.imageId ? getImagePreviewUrl(item.imageId) : null),
    [item.imageId],
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col rounded-xl border bg-background overflow-hidden touch-none shadow-sm transition-shadow hover:shadow-md",
        isDragging ? "opacity-20 bg-muted/30 border-border/40" : "opacity-100",
      )}
    >
      {/* Top Image */}
      {imageUrl && (
        <div className="relative w-full h-40 sm:h-48 bg-muted border-b border-border/40">
          <Image
            src={imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, 500px"
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      {/* Content Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 gap-4">
        {/* Left Side: Handle & Info */}
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          {/* Drag Handle */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors shrink-0 touch-none mt-0.5 sm:mt-0"
          >
            <DotsSixVertical className="h-5 w-5" weight="bold" />
          </button>

          {/* Info */}
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-base text-foreground break-words">
              {item.name}
            </span>
            {customizationStepCount > 0 && (
              <Badge
                variant="outline"
                className="text-xs gap-1 border-primary/40 text-primary bg-primary/5"
              >
                <SlidersHorizontal className="w-3 h-3" weight="bold" />
                {customizationStepCount}{" "}
                {customizationStepCount === 1 ? "Schritt" : "Schritte"}
              </Badge>
            )}
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed break-words">
              {item.description}
            </p>
          )}
          <span className="text-sm font-bold text-foreground">
            {formatPrice(item.price)}
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t border-border/40 pt-3 sm:pt-0 sm:border-t-0 mt-2 sm:mt-0 w-full sm:w-auto">
        <Switch
          checked={item.available}
          onCheckedChange={(checked) => onToggleAvailability(checked)}
        />

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="rounded-full text-muted-foreground hover:text-foreground"
            title="Bearbeiten"
          >
            <PencilSimple className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="default"
            onClick={onDelete}
            className="gap-2 font-medium border-border text-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors shrink-0"
            title={t("delete")}
          >
            <Trash className="h-4 w-4 shrink-0" weight="bold" />
            <span>{t("delete")}</span>
          </Button>
        </div>
      </div>
    </div>
  </div>
  );
});

interface SortableItemRowProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
  onToggleAvailability: (itemId: string, available: boolean) => void;
}

const SortableItemRow = memo(function SortableItemRow(
  props: SortableItemRowProps,
) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.item.$id,
    data: { type: "item", item: props.item },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform) || "translate3d(0, 0, 0)",
    transition: isDragging
      ? undefined
      : transition || "transform 200ms cubic-bezier(0.2, 0, 0, 1)",
    zIndex: isDragging ? 50 : 0,
  };

  const handleEdit = useCallback(
    () => props.onEdit(props.item),
    [props.onEdit, props.item],
  );
  const handleDelete = useCallback(
    () => props.onDelete(props.item),
    [props.onDelete, props.item],
  );
  const handleToggle = useCallback(
    (available: boolean) =>
      props.onToggleAvailability(props.item.$id, available),
    [props.onToggleAvailability, props.item.$id],
  );

  return (
    <ItemRowView
      item={props.item}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onToggleAvailability={handleToggle}
      setNodeRef={setNodeRef}
      style={style}
      attributes={attributes}
      listeners={listeners}
      isDragging={isDragging}
    />
  );
});
