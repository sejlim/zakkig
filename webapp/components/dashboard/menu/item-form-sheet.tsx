'use client'

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CircleNotch, FloppyDisk, SlidersHorizontal, Image as ImageIcon, Tag, Percent } from '@phosphor-icons/react'
import { useTranslation } from '@/lib/i18n'
import { ImageUpload } from './image-upload'
import { CustomizationBuilder } from './customization-builder'
import type { MenuItem, MenuCategory, CustomizationStep } from '@/lib/types'

interface ItemFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingItem: MenuItem | null
  categories: MenuCategory[]
  selectedCategoryId: string
  organizationId: string
  itemAction: (payload: FormData) => void
  isItemPending: boolean
  itemState: { error?: string; success?: boolean }
}

export function ItemFormSheet({
  open,
  onOpenChange,
  editingItem,
  categories,
  selectedCategoryId,
  organizationId,
  itemAction,
  isItemPending,
  itemState,
}: ItemFormSheetProps) {
  const { t } = useTranslation()

  const [categoryId, setCategoryId] = useState(selectedCategoryId)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [taxRate, setTaxRate] = useState('19.0')
  const [available, setAvailable] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [enableCustomizations, setEnableCustomizations] = useState(false)
  const [customizationSteps, setCustomizationSteps] = useState<CustomizationStep[]>([])

  // Reset or initialize state when opening sheet or editing item changes
  useEffect(() => {
    if (open) {
      if (editingItem) {
        setCategoryId(editingItem.categoryId)
        setName(editingItem.name)
        setDescription(editingItem.description || '')
        setPrice((editingItem.price / 100).toFixed(2))
        setTaxRate(String(editingItem.taxRate ?? 19.0))
        setAvailable(editingItem.available)
        setSelectedFile(null)
        setRemoveImage(false)

        try {
          const parsed = JSON.parse(editingItem.customizations || '[]')
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCustomizationSteps(parsed)
            setEnableCustomizations(true)
          } else {
            setCustomizationSteps([])
            setEnableCustomizations(false)
          }
        } catch {
          setCustomizationSteps([])
          setEnableCustomizations(false)
        }
      } else {
        setCategoryId(selectedCategoryId || (categories[0]?.$id ?? ''))
        setName('')
        setDescription('')
        setPrice('')
        setTaxRate('19.0')
        setAvailable(true)
        setSelectedFile(null)
        setRemoveImage(false)
        setCustomizationSteps([])
        setEnableCustomizations(false)
      }
    }
  }, [open, editingItem, selectedCategoryId, categories])

  // Close sheet on success
  useEffect(() => {
    if (itemState.success && open) {
      onOpenChange(false)
    }
  }, [itemState.success, open, onOpenChange])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData()

    formData.append('organizationId', organizationId)
    formData.append('categoryId', categoryId)
    formData.append('name', name)
    formData.append('description', description)
    formData.append('price', price)
    formData.append('taxRate', taxRate)
    formData.append('available', String(available))

    if (editingItem) {
      formData.append('itemId', editingItem.$id)
      formData.append('existingImageId', editingItem.imageId || '')
      if (removeImage) {
        formData.append('removeImage', 'true')
      }
    }

    if (selectedFile) {
      formData.append('image', selectedFile)
    }

    // Process customizations JSON
    const finalSteps = enableCustomizations ? customizationSteps : []
    formData.append('customizations', JSON.stringify(finalSteps))

    itemAction(formData)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col h-full p-0 gap-0 border-l border-border bg-background">
        {/* Header */}
        <SheetHeader className="p-6 pb-4 border-b border-border text-left">
          <SheetTitle className="text-xl font-bold flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" weight="bold" />
            {editingItem ? t('editItem') : t('addItem')}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            {editingItem
              ? t('editItem')
              : t('noItemsHint')}
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable Form Body */}
        <form
          id="item-form-sheet"
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          <ScrollArea className="flex-1 min-h-0 w-full">
            <div className="p-6 space-y-6">
              {/* Category Picker */}
              {categories.length > 1 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{t('categories')}</Label>
                  <Select value={categoryId} onValueChange={(val) => val && setCategoryId(val)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t('categoryName')} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.$id} value={c.$id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Section 1: Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  {t('basicInfo')}
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="item-sheet-name" className="text-sm font-medium">
                    {t('itemName')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="item-sheet-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="z.B. Cheeseburger, Pizza Margherita, Wrap"
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="item-sheet-desc" className="text-sm font-medium">
                    {t('description')}
                  </Label>
                  <Textarea
                    id="item-sheet-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Zutaten, Zubereitung oder Allergen-Hinweise..."
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="item-sheet-price" className="text-sm font-medium">
                      {t('price')} (€) <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="item-sheet-price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                        required
                        className="h-11 pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">
                        €
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="item-sheet-tax" className="text-sm font-medium flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5" />
                      {t('taxRatePercent')}
                    </Label>
                    <Select value={taxRate} onValueChange={(val) => val && setTaxRate(val)}>
                      <SelectTrigger id="item-sheet-tax" className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="19.0">19% (Standard)</SelectItem>
                        <SelectItem value="7.0">7% (Ermäßigt)</SelectItem>
                        <SelectItem value="0.0">0% (Befreit)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Section 2: Image */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  {t('imageSection')}
                </h3>
                <ImageUpload
                  existingImageId={editingItem?.imageId}
                  onFileSelect={(file) => {
                    setSelectedFile(file)
                    setRemoveImage(false)
                  }}
                  onRemoveExisting={() => {
                    setRemoveImage(true)
                    setSelectedFile(null)
                  }}
                />
              </div>

              <Separator />

              {/* Section 3: Availability */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold">{t('available')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {available ? t('available') : t('unavailable')}
                  </p>
                </div>
                <Switch
                  checked={available}
                  onCheckedChange={setAvailable}
                />
              </div>

              <Separator />

              {/* Section 4: Customization (Subway style step-by-step) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-semibold flex items-center gap-2">
                      <SlidersHorizontal className="w-5 h-5 text-primary" weight="bold" />
                      {t('customization')}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t('customizationDesc')}
                    </p>
                  </div>
                  <Switch
                    checked={enableCustomizations}
                    onCheckedChange={setEnableCustomizations}
                  />
                </div>

                {enableCustomizations && (
                  <div className="pt-2">
                    <CustomizationBuilder
                      steps={customizationSteps}
                      onChange={setCustomizationSteps}
                    />
                  </div>
                )}
              </div>

              {/* Error display */}
              {itemState.error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg font-medium">
                  {itemState.error}
                </div>
              )}
            </div>
          </ScrollArea>
        </form>

        {/* Footer */}
        <SheetFooter className="p-6 border-t border-border bg-background flex-row sm:justify-end gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isItemPending}
            className="flex-1 sm:flex-initial h-11"
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            form="item-form-sheet"
            disabled={isItemPending}
            className="flex-1 sm:flex-initial h-11 gap-2 font-semibold"
          >
            {isItemPending ? (
              <>
                <CircleNotch className="w-5 h-5 animate-spin" weight="bold" />
                {t('saving')}
              </>
            ) : (
              <>
                <FloppyDisk className="w-5 h-5" weight="bold" />
                {t('save')}
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
