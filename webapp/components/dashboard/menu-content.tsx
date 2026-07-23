'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  DndContext,
  closestCenter,
  rectIntersection,
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
  rectSortingStrategy,
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
  Check,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { RefreshButton } from './refresh-button'
import { ItemWorkspace } from './menu/item-workspace'

import { useTranslation, formatPrice } from '@/lib/i18n'
import { getImagePreviewUrl } from '@/lib/appwrite/client'
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
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

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    setIsDesktop(media.matches)
    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])
  return isDesktop
}

export function MenuContent({
  categories: initialCategories,
  items: initialItems,
  organizationId,
}: MenuContentProps) {
  const { t } = useTranslation()
  const [, startTransition] = useTransition()
  const isDesktop = useIsDesktop()

  // Persistent client state for categories and items to eliminate drag & drop flickering
  const [categories, setCategories] = useState<MenuCategory[]>(initialCategories)
  const [items, setItems] = useState<MenuItem[]>(initialItems)

  useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])

  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  // Dialog & Sheet states
  const [showItemSheet, setShowItemSheet] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [autoEditCategoryId, setAutoEditCategoryId] = useState<string | null>(null)
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)

  // Collapsed categories state (map of categoryId -> isCollapsed)
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({})

  // Delete alert dialog state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'category' | 'item'
    id: string
    name: string
    imageId?: string
  } | null>(null)

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
  const handleCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((c) => c.$id === active.id)
      const newIndex = categories.findIndex((c) => c.$id === over.id)
      const previousCategories = [...categories]
      const newCategories = arrayMove(categories, oldIndex, newIndex)

      setCategories(newCategories)

      const res = await reorderCategoriesAction(
        organizationId,
        newCategories.map((c) => c.$id),
      )
      if (res?.error) {
        toast.error(res.error)
        setCategories(previousCategories)
      }
    }
  }

  // Handle Item Drag End
  const handleItemDragEnd = async (categoryId: string, event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const categoryItems = getItemsByCategory(categoryId)
      const oldIndex = categoryItems.findIndex((i) => i.$id === active.id)
      const newIndex = categoryItems.findIndex((i) => i.$id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const reorderedCategoryItems = arrayMove(categoryItems, oldIndex, newIndex)
      const previousItems = [...items]

      let catIdx = 0
      const newAllItems = items.map((item) => {
        if (item.categoryId === categoryId) {
          const newItem = reorderedCategoryItems[catIdx]
          catIdx++
          return newItem
        }
        return item
      })

      setItems(newAllItems)

      const res = await reorderItemsAction(
        organizationId,
        reorderedCategoryItems.map((i) => i.$id),
      )
      if (res?.error) {
        toast.error(res.error)
        setItems(previousItems)
      }
    }
  }

  // In-place category creation handler
  async function openNewCategory() {
    if (isCreatingCategory) return
    setIsCreatingCategory(true)

    const tempId = `temp-${Date.now()}`
    const defaultName = t('newCategory')
    const newSortOrder = categories.length

    const tempCategory: MenuCategory = {
      $id: tempId,
      organizationId,
      name: defaultName,
      sortOrder: newSortOrder,
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      $permissions: [],
      $databaseId: '',
      $collectionId: '',
    }

    setCategories((prev) => [...prev, tempCategory])
    setCollapsedCategories((prev) => ({ ...prev, [tempId]: false }))
    setAutoEditCategoryId(tempId)

    const formData = new FormData()
    formData.append('organizationId', organizationId)
    formData.append('name', defaultName)
    formData.append('sortOrder', newSortOrder.toString())

    try {
      const res = await createCategoryAction({}, formData)
      if (res?.error) {
        toast.error(res.error)
        setCategories((prev) => prev.filter((c) => c.$id !== tempId))
        setAutoEditCategoryId(null)
      } else if (res?.categoryId) {
        const realId = res.categoryId
        setCategories((prev) =>
          prev.map((c) => (c.$id === tempId ? { ...c, $id: realId } : c)),
        )
        setCollapsedCategories((prev) => {
          const next = { ...prev }
          delete next[tempId]
          next[realId] = false
          return next
        })
        setAutoEditCategoryId(realId)
      }
    } finally {
      setIsCreatingCategory(false)
    }
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
    setCollapsedCategories((prev) => {
      const isCurrentlyCollapsed = prev[categoryId] ?? true
      return {
        ...prev,
        [categoryId]: !isCurrentlyCollapsed,
      }
    })
  }

  // Delete Action Confirmations
  async function confirmDelete() {
    if (!deleteConfirm) return
    if (deleteConfirm.type === 'category') {
      const res = await deleteCategoryAction(deleteConfirm.id, organizationId)
      if (res?.error) toast.error(res.error)
    } else {
      const res = await deleteMenuItemAction(
        deleteConfirm.id,
        organizationId,
        deleteConfirm.imageId,
      )
      if (res?.error) toast.error(res.error)
    }
    setDeleteConfirm(null)
  }

  function handleToggleAvailability(itemId: string, available: boolean) {
    const previousItems = [...items]
    const updatedItems = items.map((i) =>
      i.$id === itemId ? { ...i, available } : i,
    )
    setItems(updatedItems)
    startTransition(async () => {
      const res = await toggleMenuItemAvailability(itemId, available, organizationId)
      if (res?.error) {
        toast.error(res.error)
        setItems(previousItems)
      }
    })
  }

  return (
    <div className="flex-1 space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between space-y-2 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('menu')}</h1>
        </div>

        <div className="flex items-center gap-2">
          <RefreshButton />
        </div>
      </div>

      {/* Categories Cards View */}
      {categories.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-foreground">{t('noCategories')}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {t('noCategoriesHint')}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={openNewCategory}
            className="border-2 border-dashed border-muted-foreground/40 hover:border-primary font-semibold text-sm text-muted-foreground hover:text-primary hover:bg-primary/10 gap-2 transition-colors cursor-pointer mt-2"
          >
            <Plus className="h-4 w-4 shrink-0" weight="bold" />
            <span>{t('addCategory')}</span>
          </Button>
        </div>
      ) : (
        <DndContext
          id="menu-categories-dnd"
          sensors={sensors}
          collisionDetection={rectIntersection}
          onDragEnd={handleCategoryDragEnd}
        >
          <SortableContext
            items={categories.map((c) => c.$id)}
            strategy={rectSortingStrategy}
          >
            {isDesktop ? (
              <div className="flex gap-6 items-start w-full">
                {/* Left Column (Even Index: 0, 2, 4...) */}
                <div className="flex flex-col gap-6 flex-1 min-w-0">
                  {categories
                    .filter((_, i) => i % 2 === 0)
                    .map((category) => (
                      <SortableCategoryCard
                        key={category.$id}
                        category={category}
                        categoryItems={getItemsByCategory(category.$id)}
                        isCollapsed={collapsedCategories[category.$id] ?? true}
                        autoEditName={autoEditCategoryId === category.$id}
                        onEditComplete={() => setAutoEditCategoryId(null)}
                        onToggleCollapse={() => toggleCategoryCollapse(category.$id)}
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
                    ))}
                  {categories.length % 2 === 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={openNewCategory}
                      className="w-full border-2 border-dashed border-muted-foreground/40 hover:border-primary font-semibold text-sm text-muted-foreground hover:text-primary hover:bg-primary/10 gap-2 transition-colors cursor-pointer"
                    >
                      <Plus className="h-4 w-4 shrink-0" weight="bold" />
                      <span>{t('addCategory')}</span>
                    </Button>
                  )}
                </div>

                {/* Right Column (Odd Index: 1, 3, 5...) */}
                <div className="flex flex-col gap-6 flex-1 min-w-0">
                  {categories
                    .filter((_, i) => i % 2 === 1)
                    .map((category) => (
                      <SortableCategoryCard
                        key={category.$id}
                        category={category}
                        categoryItems={getItemsByCategory(category.$id)}
                        isCollapsed={collapsedCategories[category.$id] ?? true}
                        autoEditName={autoEditCategoryId === category.$id}
                        onEditComplete={() => setAutoEditCategoryId(null)}
                        onToggleCollapse={() => toggleCategoryCollapse(category.$id)}
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
                    ))}
                  {categories.length % 2 === 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={openNewCategory}
                      className="w-full border-2 border-dashed border-muted-foreground/40 hover:border-primary font-semibold text-sm text-muted-foreground hover:text-primary hover:bg-primary/10 gap-2 transition-colors cursor-pointer"
                    >
                      <Plus className="h-4 w-4 shrink-0" weight="bold" />
                      <span>{t('addCategory')}</span>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6 w-full">
                {categories.map((category) => (
                  <SortableCategoryCard
                    key={category.$id}
                    category={category}
                    categoryItems={getItemsByCategory(category.$id)}
                    isCollapsed={collapsedCategories[category.$id] ?? true}
                    autoEditName={autoEditCategoryId === category.$id}
                    onEditComplete={() => setAutoEditCategoryId(null)}
                    onToggleCollapse={() => toggleCategoryCollapse(category.$id)}
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
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={openNewCategory}
                  className="w-full border-2 border-dashed border-muted-foreground/40 hover:border-primary font-semibold text-sm text-muted-foreground hover:text-primary hover:bg-primary/10 gap-2 transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4 shrink-0" weight="bold" />
                  <span>{t('addCategory')}</span>
                </Button>
              </div>
            )}
          </SortableContext>
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
        <DialogContent showCloseButton={false} className="bg-primary text-primary-foreground border-border/20 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-primary-foreground text-lg font-bold">
              {deleteConfirm?.type === 'category'
                ? `Kategorie "${deleteConfirm?.name}" wirklich löschen?`
                : `Artikel "${deleteConfirm?.name}" wirklich löschen?`}
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 text-sm leading-relaxed mt-1">
              {deleteConfirm?.type === 'category'
                ? `Möchtest du die Kategorie "${deleteConfirm?.name}" und alle darin enthaltenen Artikel wirklich unwiderruflich aus deiner Speisekarte entfernen?`
                : `Möchtest du den Artikel "${deleteConfirm?.name}" wirklich unwiderruflich aus deiner Speisekarte entfernen?`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex w-full gap-3 mt-3">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10 text-primary-foreground hover:text-primary-foreground"
            >
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2 font-semibold"
            >
              <Trash className="h-4 w-4 shrink-0" weight="bold" />
              <span>{t('delete')}</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
  autoEditName?: boolean
  onEditComplete?: () => void
  onToggleCollapse: () => void
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
  autoEditName = false,
  onEditComplete,
  onToggleCollapse,
  onDeleteCategory,
  onNewItem,
  onEditItem,
  onDeleteItem,
  onToggleAvailability,
  onItemDragEnd,
  sensors,
}: SortableCategoryCardProps) {
  const { t } = useTranslation()
  const [isEditingName, setIsEditingName] = useState(autoEditName)
  const [nameVal, setNameVal] = useState(category.name)
  const [isSavingName, setIsSavingName] = useState(false)

  useEffect(() => {
    setNameVal(category.name)
  }, [category.name])

  useEffect(() => {
    if (autoEditName) {
      setIsEditingName(true)
    }
  }, [autoEditName])

  const handleSaveName = async () => {
    onEditComplete?.()
    const trimmed = nameVal.trim()
    if (!trimmed || trimmed === category.name) {
      setNameVal(category.name)
      setIsEditingName(false)
      return
    }
    setIsSavingName(true)
    const formData = new FormData()
    formData.append('categoryId', category.$id)
    formData.append('organizationId', category.organizationId)
    formData.append('name', trimmed)
    formData.append('sortOrder', category.sortOrder.toString())

    try {
      const res = await updateCategoryAction({}, formData)
      if (res?.error) {
        toast.error(res.error)
        setNameVal(category.name)
      }
    } finally {
      setIsSavingName(false)
      setIsEditingName(false)
    }
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.$id })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 p-3.5 sm:p-4 pb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted text-muted-foreground transition-colors touch-none shrink-0"
              title={t('reorderCategories' as any) || 'Reihenfolge ändern'}
            >
              <DotsSixVertical className="h-5 w-5" weight="bold" />
            </button>
            {isEditingName ? (
              <div className="flex items-center gap-1.5 flex-1 max-w-xs">
                <Input
                  value={nameVal}
                  onChange={(e) => setNameVal(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName()
                    if (e.key === 'Escape') {
                      onEditComplete?.()
                      setNameVal(category.name)
                      setIsEditingName(false)
                    }
                  }}
                  autoFocus
                  maxLength={50}
                  disabled={isSavingName}
                  className="h-8 text-base font-semibold px-2 py-0"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleSaveName}
                  disabled={isSavingName}
                  className="h-8 w-8 text-primary hover:text-primary shrink-0"
                  title="Speichern"
                >
                  <Check className="h-4 w-4" weight="bold" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className="text-base sm:text-lg font-bold tracking-tight text-foreground text-left bg-transparent border-0 p-0 cursor-pointer min-w-0 flex-1 break-words"
                onClick={onToggleCollapse}
              >
                {category.name}
              </button>
            )}
            {!isEditingName && (
              <Badge variant="secondary" className="font-semibold text-xs shrink-0">
                {categoryItems.length}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-end gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="rounded-full text-muted-foreground hover:text-foreground"
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
              onClick={() => {
                if (isEditingName) {
                  handleSaveName()
                } else {
                  setIsEditingName(true)
                }
              }}
              className="rounded-full text-muted-foreground hover:text-foreground"
              title="Kategoriename bearbeiten"
            >
              <PencilSimple className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={onDeleteCategory}
              className="gap-2 font-medium border-border text-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors shrink-0"
              title={t('delete')}
            >
              <Trash className="h-4 w-4 shrink-0" weight="bold" />
              <span>{t('delete')}</span>
            </Button>
          </div>
        </CardHeader>

        {!isCollapsed && (
          <CardContent className="pt-2 flex flex-col gap-3">
            {categoryItems.length === 0 ? (
              <div className="py-6 text-center flex flex-col items-center justify-center gap-1 border border-dashed rounded-lg bg-muted/10">
                <p className="text-sm font-medium text-muted-foreground">
                  {t('noItems')}
                </p>
              </div>
            ) : (
              <DndContext
                id={`category-items-dnd-${category.$id}`}
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
                        onToggleAvailability={(newAvailable: boolean) =>
                          onToggleAvailability(item.$id, newAvailable)
                        }
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            <Button
              type="button"
              variant="ghost"
              onClick={onNewItem}
              className="w-full border-2 border-dashed border-muted-foreground/40 hover:border-primary font-semibold text-sm text-muted-foreground hover:text-primary hover:bg-primary/10 gap-2 transition-colors"
            >
              <Plus className="h-4 w-4 shrink-0" weight="bold" />
              <span>{t('addItem')}</span>
            </Button>
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
  onToggleAvailability: (available: boolean) => void
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
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.4 : item.available ? 1 : 0.6,
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
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border bg-background p-3 hover:border-primary/40 transition-colors gap-3"
    >
      {/* Main Content Area */}
      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
        {/* Drag Handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted text-muted-foreground transition-colors shrink-0 touch-none mt-0.5 sm:mt-0"
        >
          <DotsSixVertical className="h-4 w-4" weight="bold" />
        </button>

        {/* Thumbnail */}
        {imageUrl ? (
          <div className="w-12 h-12 sm:w-12 sm:h-12 rounded-lg overflow-hidden border border-border/40 shrink-0 bg-muted flex items-center justify-center shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : null}

        {/* Info */}
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-base text-foreground break-words">{item.name}</span>
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
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
          <span className="text-sm font-bold text-foreground">
            {formatPrice(item.price)}
          </span>
        </div>
      </div>

      {/* Action Controls - Toolbar Row on Mobile */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t border-border/40 pt-2 sm:pt-0 sm:border-t-0 mt-1 sm:mt-0 w-full sm:w-auto">
        <Switch
          checked={item.available}
          onCheckedChange={(checked) => onToggleAvailability(checked)}
          title={item.available ? t('available') : t('unavailable')}
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
            title={t('delete')}
          >
            <Trash className="h-4 w-4 shrink-0" weight="bold" />
            <span>{t('delete')}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
