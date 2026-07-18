'use client'

import { useState, useActionState } from 'react'
import { Plus, PencilSimple, Trash, Eye, EyeSlash } from '@phosphor-icons/react'
import { toast, Card,   Button, Chip as Badge, Input, TextArea, Separator as Separator, Modal } from "@heroui/react"
import { PageHeader } from './page-header'

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
      <PageHeader title={t('menu')}>
        <Button onPress={openNewCategory} variant="primary">
          <Plus data-icon="inline-start" />
          {t('addCategory')}
        </Button>
      </PageHeader>

      {categories.length === 0 ? (
        <Card>
          <Card.Content className="py-12 text-center text-muted-foreground">
            {t('noCategories')}
          </Card.Content>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {categories.map((category) => {
            const categoryItems = getItemsByCategory(category.$id)
            return (
              <Card key={category.$id}>
                <Card.Header className="flex-col items-start gap-2">
                  <div className="flex items-center justify-between w-full">
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="tertiary"
                        size="sm"
                        isIconOnly
                        onPress={() => openEditCategory(category)}
                      >
                        <PencilSimple />
                      </Button>
                      <Button
                        variant="danger-soft"
                        size="sm"
                        isIconOnly
                        onPress={() => handleDeleteCategory(category.$id)}
                      >
                        <Trash />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onPress={() => openNewItem(category.$id)}
                      >
                        <Plus data-icon="inline-start" />
                        {t('addItem')}
                      </Button>
                    </div>
                  </div>
                </Card.Header>
                <Card.Content>
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
                                <Badge color="default" variant="soft">{t('unavailable')}</Badge>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            )}
                            <span className="text-sm font-medium">{formatPrice(item.price)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="tertiary"
                              size="sm"
                              isIconOnly
                              onPress={() => handleToggleAvailability(item.$id, !item.available)}
                            >
                              {item.available ? <Eye /> : <EyeSlash />}
                            </Button>
                            <Button
                              variant="tertiary"
                              size="sm"
                              isIconOnly
                              onPress={() => openEditItem(item)}
                            >
                              <PencilSimple />
                            </Button>
                            <Button
                              variant="danger-soft"
                              size="sm"
                              isIconOnly
                              onPress={() => handleDeleteItem(item.$id, item.imageId)}
                            >
                              <Trash />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Content>
              </Card>
            )
          })}
        </div>
      )}

      <Modal>
        <Modal.Backdrop isOpen={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header className="flex flex-col gap-1">
                <Modal.Heading className="text-lg font-semibold">
                  {editingCategory ? t('editCategory') : t('addCategory')}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <form action={categoryAction} className="flex flex-col gap-4" id="category-form">
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
                    <p className="text-sm text-danger">{categoryState.error}</p>
                  )}
                </form>
              </Modal.Body>
              <Modal.Footer>
                <Button type="submit" form="category-form" isDisabled={isCategoryPending} variant="primary">
                  {t('save')}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal>
        <Modal.Backdrop isOpen={showItemDialog} onOpenChange={setShowItemDialog}>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header className="flex flex-col gap-1">
                <Modal.Heading className="text-lg font-semibold">
                  {editingItem ? t('editItem') : t('addItem')}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <form action={itemAction} className="flex flex-col gap-4" id="item-form">
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
                    <p className="text-sm text-danger">{itemState.error}</p>
                  )}
                </form>
              </Modal.Body>
              <Modal.Footer>
                <Button type="submit" form="item-form" isDisabled={isItemPending} variant="primary">
                  {t('save')}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  )
}
