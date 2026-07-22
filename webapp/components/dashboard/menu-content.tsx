'use client'

import { useState, useActionState, useTransition, useOptimistic } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { RefreshButton } from './refresh-button'
import { ItemWorkspace } from './menu/item-workspace'

import { useTranslation, formatPrice } from '@/lib/i18n'
import { getImagePreviewUrl } from '@/lib/appwrite/client'
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  createMenuItemAction,
  updateMenuItemAction,
  deleteMenuItemAction,
  toggleMenuItemAvailability,
  reorderCategoriesAction,
  reorderItemsAction,
} from '@/actions/menu-actions'
import type { MenuCategory, MenuItem, CustomizationStep } from '@/lib/types'

interface MenuContentProps {
  categories: MenuCategory[]
  items: MenuItem[]
  organizationId: string
}

export function MenuContent({
  categories: initialCategories,
  items: initialItems,
  organizationId,
}: MenuContentProps) {
  const { t } = useTranslation()
  const [, startTransition] = useTransition()

  // Optimistic state for categories and items reordering
  const [categories, setOptimisticCategories] = useOptimistic<MenuCategory[]>(
    initialCategories,
  )
  const [items, setOptimisticItems] = useOptimistic<MenuItem[]>(initialItems)

  // Dialog & Sheet states
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [showItemSheet, setShowItemSheet] = useState(false)
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')

  // Collapsed categories state (map of categoryId -> isCollapsed)
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({})

  // Delete alert dialog state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'category' | 'item'
    id: string
    name: string
    imageId?: string
  } | null>(null)

  // Form actions
  const [categoryState, categoryAction, isCategoryPending] = useActionState(
    editingCategory ? updateCategoryAction : createCategoryAction,
    {},
  )

  const [itemState, itemAction, isItemPending] = useActionState(
    editingItem ? updateMenuItemAction : createMenuItemAction,
    {},
  )

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
  )

  // Filter items by category
  function getItemsByCategory(categoryId: string) {
    return items.filter((item) => item.categoryId === categoryId)
  }

  // Handle Category Drag End
  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((c) => c.$id === active.id)
      const newIndex = categories.findIndex((c) => c.$id === over.id)
      const newCategories = arrayMove(categories, oldIndex, newIndex)

      startTransition(async () => {
        setOptimisticCategories(newCategories)
        const res = await reorderCategoriesAction(
          organizationId,
          newCategories.map((c) => c.$id),
        )
        if (res?.error) toast.error(res.error)
      })
    }
  }

  // Handle Item Drag End
  const handleItemDragEnd = (categoryId: string, event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const categoryItems = getItemsByCategory(categoryId)
      const oldIndex = categoryItems.findIndex((i) => i.$id === active.id)
      const newIndex = categoryItems.findIndex((i) => i.$id === over.id)
      const reorderedCategoryItems = arrayMove(categoryItems, oldIndex, newIndex)

      const newAllItems = items.map((item) => {
        if (item.categoryId !== categoryId) return item
        const found = reorderedCategoryItems.find((r) => r.$id === item.$id)
        return found ?? item
      })

      startTransition(async () => {
        setOptimisticItems(newAllItems)
        const res = await reorderItemsAction(
          organizationId,
          reorderedCategoryItems.map((i) => i.$id),
        )
        if (res?.error) toast.error(res.error)
      })
    }
  }

  // Modal Handlers
  function openNewCategory() {
    setEditingCategory(null)
    setShowCategoryDialog(true)
  }

  function openEditCategory(category: MenuCategory) {
    setEditingCategory(category)
    setShowCategoryDialog(true)
  }

  function openNewItem(categoryId: string) {
    setEditingItem(null)
    setSelectedCategoryId(categoryId)
    setShowItemSheet(true)
  }

  function openEditItem(item: MenuItem) {
    setEditingItem(item)
    setSelectedCategoryId(item.categoryId)
    setShowItemSheet(true)
  }

  function toggleCategoryCollapse(categoryId: string) {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
  }

  // Delete Action Confirmations
  async function confirmDelete() {
    if (!deleteConfirm) return
    if (deleteConfirm.type === 'category') {
      const res = await deleteCategoryAction(deleteConfirm.id, organizationId)
      if (res.success) toast.success(t('categoryDeleted'))
      else if (res.error) toast.error(res.error)
    } else {
      const res = await deleteMenuItemAction(
        deleteConfirm.id,
        organizationId,
        deleteConfirm.imageId,
      )
      if (res.success) toast.success(t('itemDeleted'))
      else if (res.error) toast.error(res.error)
    }
    setDeleteConfirm(null)
  }

  async function handleToggleAvailability(itemId: string, available: boolean) {
    await toggleMenuItemAvailability(itemId, available, organizationId)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('menu')}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={openNewCategory} variant="default" className="gap-2 font-semibold">
            <Plus className="h-4 w-4" weight="bold" />
            {t('addCategory')}
          </Button>
          <RefreshButton />
        </div>
      </div>

      {/* Categories Cards View */}
      {categories.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center flex flex-col items-center justify-center gap-3">
            <div className="p-4 rounded-full bg-primary/10 text-primary">
              <Plus className="w-8 h-8" weight="bold" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">{t('noCategories')}</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {t('noCategoriesHint')}
              </p>
            </div>
            <Button onClick={openNewCategory} variant="default" className="mt-2 gap-2">
              <Plus className="h-4 w-4" weight="bold" />
              {t('addCategory')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleCategoryDragEnd}
        >
          <SortableContext
            items={categories.map((c) => c.$id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-6">
              {categories.map((category) => {
                const categoryItems = getItemsByCategory(category.$id)
                const isCollapsed = collapsedCategories[category.$id] ?? false

                return (
                  <SortableCategoryCard
                    key={category.$id}
                    category={category}
                    categoryItems={categoryItems}
                    isCollapsed={isCollapsed}
                    onToggleCollapse={() => toggleCategoryCollapse(category.$id)}
                    onEditCategory={() => openEditCategory(category)}
                    onDeleteCategory={() =>
                      setDeleteConfirm({
                        type: 'category',
                        id: category.$id,
                        name: category.name,
                      })
                    }
                    onNewItem={() => openNewItem(category.$id)}
                    onEditItem={openEditItem}
                    onDeleteItem={(item) =>
                      setDeleteConfirm({
                        type: 'item',
                        id: item.$id,
                        name: item.name,
                        imageId: item.imageId,
                      })
                    }
                    onToggleAvailability={handleToggleAvailability}
                    onItemDragEnd={(e) => handleItemDragEnd(category.$id, e)}
                    sensors={sensors}
                  />
                )
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Category Create/Edit Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? t('editCategory') : t('addCategory')}
            </DialogTitle>
          </DialogHeader>
          <form
            action={categoryAction}
            noValidate
            className="flex flex-col gap-4 py-4"
            id="category-form"
          >
            <input type="hidden" name="organizationId" value={organizationId} />
            {editingCategory && (
              <input type="hidden" name="categoryId" value={editingCategory.$id} />
            )}
            <div className="flex flex-col gap-2">
              <label htmlFor="category-name" className="text-sm font-medium">
                {t('categoryName')} <span className="text-destructive">*</span>
              </label>
              <Input
                id="category-name"
                name="name"
                defaultValue={editingCategory?.name ?? ''}
                placeholder="z.B. Vorspeisen, Hauptgerichte, Getränke"
                required
                className="h-11"
              />
            </div>
            <input
              type="hidden"
              name="sortOrder"
              value={editingCategory?.sortOrder ?? categories.length}
            />
            {categoryState.error && (
              <p className="text-sm text-destructive font-medium">
                {categoryState.error}
              </p>
            )}
          </form>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCategoryDialog(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              form="category-form"
              disabled={isCategoryPending}
              variant="default"
              className="gap-2 font-semibold"
            >
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Create/Edit Dual-Pane Workspace */}
      <ItemWorkspace
        open={showItemSheet}
        onOpenChange={setShowItemSheet}
        editingItem={editingItem}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        organizationId={organizationId}
        itemAction={itemAction}
        isItemPending={isItemPending}
        itemState={itemState}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === 'category'
                ? t('confirmDeleteCategoryDesc')
                : t('confirmDeleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sortable Category Card Component
// ─────────────────────────────────────────────────────────────────────────────

interface SortableCategoryCardProps {
  category: MenuCategory
  categoryItems: MenuItem[]
  isCollapsed: boolean
  onToggleCollapse: () => void
  onEditCategory: () => void
  onDeleteCategory: () => void
  onNewItem: () => void
  onEditItem: (item: MenuItem) => void
  onDeleteItem: (item: MenuItem) => void
  onToggleAvailability: (itemId: string, available: boolean) => void
  onItemDragEnd: (event: DragEndEvent) => void
  sensors: any
}

function SortableCategoryCard({
  category,
  categoryItems,
  isCollapsed,
  onToggleCollapse,
  onEditCategory,
  onDeleteCategory,
  onNewItem,
  onEditItem,
  onDeleteItem,
  onToggleAvailability,
  onItemDragEnd,
  sensors,
}: SortableCategoryCardProps) {
  const { t } = useTranslation()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.$id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.7 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted text-muted-foreground transition-colors touch-none shrink-0"
              title={t('reorderCategories' as any) || 'Reihenfolge ändern'}
            >
              <DotsSixVertical className="h-5 w-5" weight="bold" />
            </button>
            <button
              type="button"
              className="text-lg font-semibold tracking-tight truncate hover:opacity-80 transition-opacity text-left bg-transparent border-0 p-0 cursor-pointer"
              onClick={onToggleCollapse}
            >
              {category.name}
            </button>
            <Badge variant="secondary" className="font-semibold text-xs shrink-0">
              {categoryItems.length}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="h-8 w-8 text-muted-foreground"
              title={isCollapsed ? 'Aufklappen' : 'Einklappen'}
            >
              {isCollapsed ? (
                <CaretDown className="h-4 w-4" weight="bold" />
              ) : (
                <CaretUp className="h-4 w-4" weight="bold" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onEditCategory}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <PencilSimple className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDeleteCategory}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              onClick={onNewItem}
              className="ml-2 gap-2"
            >
              <Plus className="h-4 w-4" weight="bold" />
              {t('addItem')}
            </Button>
          </div>
        </CardHeader>

        {!isCollapsed && (
          <CardContent className="pt-2">
            {categoryItems.length === 0 ? (
              <div className="py-8 text-center flex flex-col items-center justify-center gap-2 border border-dashed rounded-lg bg-muted/10">
                <p className="text-sm font-medium text-muted-foreground">
                  {t('noItems')}
                </p>
                <Button
                  variant="outline"
                  onClick={onNewItem}
                  className="gap-2 mt-2"
                >
                  <Plus className="h-4 w-4" weight="bold" />
                  {t('addItem')}
                </Button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onItemDragEnd}
              >
                <SortableContext
                  items={categoryItems.map((i) => i.$id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-2.5">
                    {categoryItems.map((item) => (
                      <SortableItemRow
                        key={item.$id}
                        item={item}
                        onEdit={() => onEditItem(item)}
                        onDelete={() => onDeleteItem(item)}
                        onToggleAvailability={() =>
                          onToggleAvailability(item.$id, !item.available)
                        }
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sortable Item Row Component
// ─────────────────────────────────────────────────────────────────────────────

interface SortableItemRowProps {
  item: MenuItem
  onEdit: () => void
  onDelete: () => void
  onToggleAvailability: () => void
}

function SortableItemRow({
  item,
  onEdit,
  onDelete,
  onToggleAvailability,
}: SortableItemRowProps) {
  const { t } = useTranslation()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.$id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.7 : item.available ? 1 : 0.6,
  }

  // Parse customization step count
  let customizationStepCount = 0
  try {
    const parsed: CustomizationStep[] = JSON.parse(item.customizations || '[]')
    if (Array.isArray(parsed)) customizationStepCount = parsed.length
  } catch {}

  const imageUrl = item.imageId ? getImagePreviewUrl(item.imageId, 120, 120) : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded-xl border bg-background p-3 hover:border-primary/40 transition-colors gap-3"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Drag Handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted text-muted-foreground transition-colors shrink-0 touch-none"
        >
          <DotsSixVertical className="h-4 w-4" weight="bold" />
        </button>

        {/* Thumbnail */}
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
          />
        ) : null}

        {/* Info */}
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-base truncate">{item.name}</span>
            {!item.available && (
              <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                {t('unavailable')}
              </Badge>
            )}
            {customizationStepCount > 0 && (
              <Badge variant="outline" className="text-xs gap-1 border-primary/40 text-primary bg-primary/5">
                <SlidersHorizontal className="w-3 h-3" weight="bold" />
                {customizationStepCount} {customizationStepCount === 1 ? 'Schritt' : 'Schritte'}
              </Badge>
            )}
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {item.description}
            </p>
          )}
          <span className="text-sm font-bold text-foreground">
            {formatPrice(item.price)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleAvailability}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title={item.available ? t('available') : t('unavailable')}
        >
          {item.available ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeSlash className="h-4 w-4 text-muted-foreground/50" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <PencilSimple className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
