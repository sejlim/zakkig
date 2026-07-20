'use client'

import { useState, useActionState } from 'react'
import { Plus, PencilSimple, Trash, Eye, EyeSlash } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea as TextArea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { RefreshButton } from './refresh-button'

import { useTranslation, formatPrice } from '@/lib/i18n'
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  createMenuItemAction,
  updateMenuItemAction,
  deleteMenuItemAction,
  toggleMenuItemAvailability,
} from '@/actions/menu-actions'
import type { MenuCategory, MenuItem } from '@/lib/types'

interface MenuContentProps {
  categories: MenuCategory[]
  items: MenuItem[]
  organizationId: string
}

export function MenuContent({ categories, items, organizationId }: MenuContentProps) {
  const { t } = useTranslation()
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [showItemDialog, setShowItemDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')

  const [categoryState, categoryAction, isCategoryPending] = useActionState(
    editingCategory ? updateCategoryAction : createCategoryAction,
    {},
  )

  const [itemState, itemAction, isItemPending] = useActionState(
    editingItem ? updateMenuItemAction : createMenuItemAction,
    {},
  )

  function getItemsByCategory(categoryId: string) {
    return items.filter((item) => item.categoryId === categoryId)
  }

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
    setShowItemDialog(true)
  }

  function openEditItem(item: MenuItem) {
    setEditingItem(item)
    setSelectedCategoryId(item.categoryId)
    setShowItemDialog(true)
  }

  async function handleDeleteCategory(categoryId: string) {
    const result = await deleteCategoryAction(categoryId, organizationId)
    if (result.success) toast.success(t('saved'))
  }

  async function handleDeleteItem(itemId: string, imageId?: string) {
    const result = await deleteMenuItemAction(itemId, organizationId, imageId)
    if (result.success) toast.success(t('saved'))
  }

  async function handleToggleAvailability(itemId: string, available: boolean) {
    await toggleMenuItemAvailability(itemId, available, organizationId)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('menu')}</h1>
        <div className="flex items-center gap-2">
          <Button onClick={openNewCategory} variant="default">
            <Plus data-icon="inline-start" className="mr-2 h-4 w-4" />
            {t('addCategory')}
          </Button>
          <RefreshButton />
        </div>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t('noCategories')}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {categories.map((category) => {
            const categoryItems = getItemsByCategory(category.$id)
            return (
              <Card key={category.$id}>
                <CardHeader className="flex-col items-start gap-2">
                  <div className="flex items-center justify-between w-full">
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditCategory(category)}
                      >
                        <PencilSimple className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteCategory(category.$id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openNewItem(category.$id)}
                      >
                        <Plus data-icon="inline-start" className="mr-2 h-4 w-4" />
                        {t('addItem')}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {categoryItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('noItems')}</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {categoryItems.map((item) => (
                        <div
                          key={item.$id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.name}</span>
                              {!item.available && (
                                <Badge variant="secondary">{t('unavailable')}</Badge>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            )}
                            <span className="text-sm font-medium">{formatPrice(item.price)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleAvailability(item.$id, !item.available)}
                            >
                              {item.available ? <Eye className="h-4 w-4" /> : <EyeSlash className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditItem(item)}
                            >
                              <PencilSimple className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDeleteItem(item.$id, item.imageId)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? t('editCategory') : t('addCategory')}
            </DialogTitle>
          </DialogHeader>
          <form action={categoryAction} noValidate className="flex flex-col gap-4 py-4" id="category-form">
            <input type="hidden" name="organizationId" value={organizationId} />
            {editingCategory && (
              <input type="hidden" name="categoryId" value={editingCategory.$id} />
            )}
            <div className="flex flex-col gap-2">
              <label htmlFor="category-name" className="text-sm font-medium">{t('categoryName')}</label>
              <Input
                id="category-name"
                name="name"
                defaultValue={editingCategory?.name ?? ''}
                required
              />
            </div>
            <input type="hidden" name="sortOrder" value={editingCategory?.sortOrder ?? categories.length} />
            {categoryState.error && (
              <p className="text-sm text-destructive">{categoryState.error}</p>
            )}
          </form>
          <DialogFooter>
            <Button type="submit" form="category-form" disabled={isCategoryPending} variant="default">
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ItemFormDialog 
        open={showItemDialog}
        onOpenChange={setShowItemDialog}
        editingItem={editingItem}
        selectedCategoryId={selectedCategoryId}
        organizationId={organizationId}
        itemAction={itemAction}
        isItemPending={isItemPending}
        itemState={itemState}
      />
    </div>
  )
}

interface ItemFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingItem: MenuItem | null
  selectedCategoryId: string
  organizationId: string
  itemAction: (payload: FormData) => void
  isItemPending: boolean
  itemState: { error?: string }
}

function ItemFormDialog({
  open,
  onOpenChange,
  editingItem,
  selectedCategoryId,
  organizationId,
  itemAction,
  isItemPending,
  itemState
}: ItemFormDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingItem ? t('editItem') : t('addItem')}
          </DialogTitle>
        </DialogHeader>
        <form action={itemAction} noValidate className="flex flex-col gap-4 py-4" id="item-form">
          <input type="hidden" name="organizationId" value={organizationId} />
          <input type="hidden" name="categoryId" value={selectedCategoryId} />
          {editingItem && (
            <>
              <input type="hidden" name="itemId" value={editingItem.$id} />
              <input type="hidden" name="existingImageId" value={editingItem.imageId} />
              <input type="hidden" name="available" value={String(editingItem.available)} />
            </>
          )}
          <div className="flex flex-col gap-2">
            <label htmlFor="item-name" className="text-sm font-medium">{t('itemName')}</label>
            <Input
              id="item-name"
              name="name"
              defaultValue={editingItem?.name ?? ''}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="item-description" className="text-sm font-medium">{t('description')}</label>
            <TextArea
              id="item-description"
              name="description"
              defaultValue={editingItem?.description ?? ''}
              rows={2}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="item-price" className="text-sm font-medium">{t('price')} (€)</label>
            <Input
              id="item-price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={editingItem ? (editingItem.price / 100).toFixed(2) : ''}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="item-image" className="text-sm font-medium">{t('image')}</label>
            <Input id="item-image" name="image" type="file" accept="image/*" />
          </div>
          <input type="hidden" name="sortOrder" value={editingItem?.sortOrder ?? 0} />
          {itemState.error && (
            <p className="text-sm text-destructive">{itemState.error}</p>
          )}
        </form>
        <DialogFooter>
          <Button type="submit" form="item-form" disabled={isItemPending} variant="default">
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
