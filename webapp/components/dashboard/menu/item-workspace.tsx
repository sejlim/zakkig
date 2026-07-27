"use client";

import { useState, useEffect, useRef, startTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CircleNotch,
  FloppyDisk,
  SlidersHorizontal,
  Tag,
  Sparkle,
  ImageSquare,
  Info,
} from "@phosphor-icons/react";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";
import { ImageUpload } from "./image-upload";
import { CustomizationBuilder } from "./customization-builder";
import { PRESET_TEMPLATES, type PresetTemplate } from "@/lib/preset-templates";
import {
  createMenuItemAction,
  updateMenuItemAction,
} from "@/actions/menu-actions";
import type { MenuItem, MenuCategory, CustomizationStep } from "@/lib/types";

interface ItemWorkspaceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: MenuItem | null;
  categories: MenuCategory[];
  selectedCategoryId: string;
  organizationId: string;
}

export function ItemWorkspace({
  open,
  onOpenChange,
  editingItem,
  categories,
  selectedCategoryId,
  organizationId,
}: ItemWorkspaceProps) {
  const { t, locale } = useTranslation();

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const categoryIdRef = useRef(selectedCategoryId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [available, setAvailable] = useState(true);
  const selectedFileRef = useRef<File | null>(null);
  const removeImageRef = useRef(false);
  const [enableCustomizations, setEnableCustomizations] = useState(false);
  const [customizationSteps, setCustomizationSteps] = useState<
    CustomizationStep[]
  >([]);

  // Validation errors
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({});

  // Reset or initialize state when workspace opens
  useEffect(() => {
    if (open) {
      setErrors({});
      setIsSubmitting(false);
      if (editingItem) {
        categoryIdRef.current = editingItem.categoryId;
        setName(editingItem.name);
        setDescription(editingItem.description || "");
        setPrice((editingItem.price / 100).toFixed(2));
        setAvailable(editingItem.available);
        selectedFileRef.current = null;
        removeImageRef.current = false;

        try {
          const parsed = JSON.parse(editingItem.customizations || "[]");
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCustomizationSteps(parsed);
            setEnableCustomizations(true);
          } else {
            setCustomizationSteps([]);
            setEnableCustomizations(false);
          }
        } catch {
          setCustomizationSteps([]);
          setEnableCustomizations(false);
        }
      } else {
        categoryIdRef.current = selectedCategoryId || (categories[0]?.$id ?? "");
        setName("");
        setDescription("");
        setPrice("");
        setAvailable(true);
        selectedFileRef.current = null;
        removeImageRef.current = false;
        setCustomizationSteps([]);
        setEnableCustomizations(false);
      }
    }
  }, [open, editingItem, selectedCategoryId, categories]);

  // Apply a generic preset template
  const applyPreset = (preset: PresetTemplate) => {
    if (preset.steps.length > 0) {
      const clonedSteps: CustomizationStep[] = preset.steps.map((s, sIdx) => ({
        ...s,
        id: crypto.randomUUID(),
        sortOrder: sIdx,
        options: s.options.map((o, oIdx) => ({
          ...o,
          id: crypto.randomUUID(),
          sortOrder: oIdx,
        })),
      }));
      setCustomizationSteps(clonedSteps);
      setEnableCustomizations(true);
    } else {
      setCustomizationSteps([]);
      setEnableCustomizations(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Auth-style client validation
    const newErrors: { name?: string; price?: string } = {};
    if (!name.trim()) {
      newErrors.name = t("validationItemName");
    }
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      newErrors.price = t("validationItemPrice");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    const formData = new FormData();

    formData.append("organizationId", organizationId);
    formData.append("categoryId", categoryIdRef.current);
    formData.append("name", name.trim());
    formData.append("description", description);
    formData.append("price", price);
    formData.append("taxRate", "19.0");
    formData.append("available", String(available));

    if (editingItem) {
      formData.append("itemId", editingItem.$id);
      formData.append("existingImageId", editingItem.imageId || "");
      if (removeImageRef.current) {
        formData.append("removeImage", "true");
      }
    }

    if (selectedFileRef.current) {
      formData.append("image", selectedFileRef.current);
    }

    const finalSteps = enableCustomizations ? customizationSteps : [];
    formData.append("customizations", JSON.stringify(finalSteps));

    setIsSubmitting(true);
    try {
      const action = editingItem ? updateMenuItemAction : createMenuItemAction;
      const res = await action({}, formData);
      if (res?.error) {
        toast.error(res.error);
      } else if (res?.success) {
        onOpenChange(false);
      }
    } catch {
      toast.error(t("databaseError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!isSubmitting) {
          onOpenChange(newOpen);
        }
      }}
    >
      <DialogContent className="sm:max-w-xl md:max-w-2xl h-[85vh] max-h-[750px] p-0 flex flex-col bg-primary text-primary-foreground border-border/20 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-primary-foreground/10 shrink-0">
          <DialogTitle>
            {editingItem ? t("editItem") : t("addItem")}
          </DialogTitle>
        </DialogHeader>

        <form
          id="workspace-item-form"
          noValidate
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          <ScrollArea className="flex-1 min-h-0 w-full">
            <div className="p-6 space-y-6">
              {/* SECTION 1: DETAILS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold tracking-tight flex items-center gap-2 text-primary-foreground">
                    <Tag className="w-5 h-5 text-primary-foreground/70" />
                    {t("basicInfo")}
                  </h3>

                  {/* Verfügbar Switcher moved to header */}
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="ws-item-available"
                      className="text-sm font-semibold text-primary-foreground cursor-pointer"
                    >
                      {t("availabilitySection")}
                    </Label>
                    <Switch
                      id="ws-item-available"
                      checked={available}
                      onCheckedChange={setAvailable}
                      className="data-[checked]:!bg-primary-foreground data-[unchecked]:!bg-primary-foreground/20 [&_[data-slot=switch-thumb]]:data-[checked]:!bg-primary [&_[data-slot=switch-thumb]]:data-[unchecked]:!bg-primary-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column (Bild) */}
                  <div className="flex flex-col gap-2 h-full">
                    <Label className="text-sm font-semibold text-primary-foreground">
                      {t("imageSection")}
                    </Label>
                    <ImageUpload
                      className="flex-1"
                      existingImageId={editingItem?.imageId}
                      onFileSelect={(file) => {
                        selectedFileRef.current = file;
                        removeImageRef.current = false;
                      }}
                      onRemoveExisting={() => {
                        removeImageRef.current = true;
                        selectedFileRef.current = null;
                      }}
                    />
                  </div>

                  {/* Right Column (Details) */}
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <Label
                        htmlFor="ws-item-name"
                        className={`text-sm font-semibold ${errors.name ? "text-destructive" : "text-primary-foreground"}`}
                      >
                        {t("itemName")}{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="ws-item-name"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (errors.name)
                            setErrors((prev) => ({ ...prev, name: undefined }));
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                        placeholder={t("itemNamePlaceholder")}
                        maxLength={60}
                        className={`bg-transparent border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 ${errors.name ? "border-destructive" : ""}`}
                      />
                      {errors.name && (
                        <span className="text-sm text-destructive">
                          {errors.name}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label
                        htmlFor="ws-item-desc"
                        className="text-sm font-semibold text-primary-foreground"
                      >
                        {t("description")}
                      </Label>
                      <Textarea
                        id="ws-item-desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t("itemDescPlaceholder")}
                        rows={4}
                        maxLength={500}
                        className="resize-none bg-transparent border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 min-h-[100px]"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label
                        htmlFor="ws-item-price"
                        className={`text-sm font-semibold ${errors.price ? "text-destructive" : "text-primary-foreground"}`}
                      >
                        {t("price")} (€){" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="ws-item-price"
                          type="number"
                          step="0.01"
                          min="0"
                          max="99999"
                          value={price}
                          onChange={(e) => {
                            if (e.target.value.length > 10) return;
                            setPrice(e.target.value);
                            if (errors.price)
                              setErrors((prev) => ({
                                ...prev,
                                price: undefined,
                              }));
                          }}
                          placeholder="0.00"
                          className={`pr-7 bg-transparent border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 ${errors.price ? "border-destructive" : ""}`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-primary-foreground/50 font-medium">
                          €
                        </span>
                      </div>
                      {errors.price && (
                        <span className="text-sm text-destructive">
                          {errors.price}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-border/20" />

              {/* SECTION 2: ZUSAMMENSTELLUNG & PRESETS */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold tracking-tight flex items-center gap-2 text-primary-foreground">
                    <SlidersHorizontal className="w-5 h-5 text-primary-foreground/70" />
                    {t("customization")}
                    <TooltipProvider delay={100}>
                      <Tooltip>
                        <TooltipTrigger className="hidden sm:inline-flex items-center">
                          <Info
                            className="w-4 h-4 text-primary-foreground/50 hover:text-primary-foreground transition-colors cursor-help"
                            weight="fill"
                          />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[250px]">
                          <p>{t("customizationDesc")}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </h3>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={enableCustomizations}
                      onCheckedChange={setEnableCustomizations}
                      className="data-[checked]:!bg-primary-foreground data-[unchecked]:!bg-primary-foreground/20 [&_[data-slot=switch-thumb]]:data-[checked]:!bg-primary [&_[data-slot=switch-thumb]]:data-[unchecked]:!bg-primary-foreground"
                    />
                  </div>
                </div>

                {enableCustomizations && (
                  <div className="space-y-5 pt-1">
                    <CustomizationBuilder
                      steps={customizationSteps}
                      onChange={setCustomizationSteps}
                    />
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          {/* Fixed Footer Action Buttons */}
          <div className="flex flex-row items-center gap-3 w-full p-6 pt-4 border-t border-primary-foreground/10 shrink-0 bg-primary">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1 bg-transparent border border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground disabled:border-primary-foreground/10 disabled:text-primary-foreground/40 disabled:opacity-100"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold disabled:bg-primary-foreground/20 disabled:text-primary-foreground/50 disabled:opacity-100"
            >
              {isSubmitting ? (
                <>
                  <CircleNotch
                    className="w-5 h-5 animate-spin mr-2"
                    weight="bold"
                  />
                  {t("saving")}
                </>
              ) : (
                <>
                  <FloppyDisk className="w-5 h-5 mr-2" weight="bold" />
                  {t("save")}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
