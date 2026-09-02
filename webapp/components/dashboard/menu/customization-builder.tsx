"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash,
  CaretUp,
  CaretDown,
  DotsSixVertical,
  PencilSimple,
  Info,
  Check,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useTranslation, formatPrice } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CustomizationStep, CustomizationOption } from "@/lib/types";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface CustomizationBuilderProps {
  steps: CustomizationStep[];
  onChange: (steps: CustomizationStep[]) => void;
}

function generateId() {
  return crypto.randomUUID();
}

export function CustomizationBuilder({
  steps,
  onChange,
}: CustomizationBuilderProps) {
  const { t } = useTranslation();
  const [autoEditStepId, setAutoEditStepId] = useState<string | null>(null);
  const [autoEditOptionId, setAutoEditOptionId] = useState<string | null>(null);

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex((s) => s.id === active.id);
      const newIndex = steps.findIndex((s) => s.id === over.id);
      onChange(
        arrayMove(steps, oldIndex, newIndex).map((s, i) => ({
          ...s,
          sortOrder: i,
        })),
      );
    }
  };

  const addStep = () => {
    const newStepId = generateId();
    const newStep: CustomizationStep = {
      id: newStepId,
      name: t("newStep"),
      nameEn: "",
      minSelections: 1,
      maxSelections: 1,
      includedCount: 1,
      available: true,
      sortOrder: steps.length,
      options: [],
    };
    setAutoEditStepId(newStepId);
    onChange([...steps, newStep]);
  };

  const updateStep = (stepId: string, updates: Partial<CustomizationStep>) => {
    onChange(
      steps.map((s) => {
        if (s.id !== stepId) return s;
        if (updates.available !== undefined && !updates.options) {
          const updatedOptions = s.options.map((o) => ({
            ...o,
            available: updates.available!,
          }));
          return { ...s, ...updates, options: updatedOptions };
        }
        return { ...s, ...updates };
      }),
    );
  };

  const removeStep = (stepId: string) => {
    const updated: CustomizationStep[] = [];
    for (const s of steps) {
      if (s.id !== stepId) {
        updated.push({ ...s, sortOrder: updated.length });
      }
    }
    onChange(updated);
  };

  const addOption = (stepId: string) => {
    const step = steps.find((s) => s.id === stepId);
    if (!step) return;
    const newOptionId = generateId();
    const newOption: CustomizationOption = {
      id: newOptionId,
      name: t("newOption"),
      nameEn: "",
      extraPrice: 0,
      available: step.available ?? true,
      sortOrder: step.options.length,
    };
    setAutoEditOptionId(newOptionId);
    updateStep(stepId, { options: [...step.options, newOption] });
  };

  const updateOption = (
    stepId: string,
    optionId: string,
    updates: Partial<CustomizationOption>,
  ) => {
    const step = steps.find((s) => s.id === stepId);
    if (!step) return;
    if (step.available === false && updates.available === true) return;
    updateStep(stepId, {
      options: step.options.map((o) =>
        o.id === optionId ? { ...o, ...updates } : o,
      ),
    });
  };

  const removeOption = (stepId: string, optionId: string) => {
    const step = steps.find((s) => s.id === stepId);
    if (!step) return;
    const updatedOptions: CustomizationOption[] = [];
    for (const o of step.options) {
      if (o.id !== optionId) {
        updatedOptions.push({ ...o, sortOrder: updatedOptions.length });
      }
    }
    updateStep(stepId, { options: updatedOptions });
  };

  return (
    <Card className="border border-primary-foreground/20 bg-transparent overflow-hidden flex flex-col gap-4 p-4">
      {steps.length > 0 ? (
        <DndContext
          id="customization-steps-dnd"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={steps.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-4">
              {steps.map((step, index) => (
                <SortableStepCard
                  key={step.id || `step-${index}`}
                  step={step}
                  stepIndex={index}
                  totalSteps={steps.length}
                  autoEditStepName={autoEditStepId === step.id}
                  autoEditOptionId={autoEditOptionId}
                  onEditStepComplete={() => setAutoEditStepId(null)}
                  onEditOptionComplete={() => setAutoEditOptionId(null)}
                  onUpdate={(updates) => updateStep(step.id, updates)}
                  onRemove={() => removeStep(step.id)}
                  onAddOption={() => addOption(step.id)}
                  onUpdateOption={(optionId, updates) =>
                    updateOption(step.id, optionId, updates)
                  }
                  onRemoveOption={(optionId) => removeOption(step.id, optionId)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="p-4 text-center border border-dashed border-primary-foreground/20 rounded-xl">
          <p className="text-sm text-primary-foreground/70 font-medium">
            {t("noStepsAdded")}
          </p>
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        onClick={addStep}
        className="w-full border border-dashed border-primary-foreground/40 hover:border-primary-foreground font-semibold text-sm text-primary-foreground hover:text-primary-foreground bg-transparent hover:bg-primary-foreground/15 shrink-0 gap-2 transition-colors"
      >
        <Plus className="w-4 h-4 shrink-0" weight="bold" />
        <span>{t("addStep")}</span>
      </Button>
    </Card>
  );
}

interface StepCardProps {
  step: CustomizationStep;
  stepIndex: number;
  totalSteps: number;
  autoEditStepName?: boolean;
  autoEditOptionId?: string | null;
  onEditStepComplete?: () => void;
  onEditOptionComplete?: () => void;
  onUpdate: (updates: Partial<CustomizationStep>) => void;
  onRemove: () => void;
  onAddOption: () => void;
  onUpdateOption: (
    optionId: string,
    updates: Partial<CustomizationOption>,
  ) => void;
  onRemoveOption: (optionId: string) => void;
}

function SortableStepCard({
  step,
  stepIndex,
  totalSteps,
  autoEditStepName = false,
  autoEditOptionId,
  onEditStepComplete,
  onEditOptionComplete,
  onUpdate,
  onRemove,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
}: StepCardProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditingName, setIsEditingName] = useState(autoEditStepName);

  const finishEditingName = () => {
    setIsEditingName(false);
    onEditStepComplete?.();
  };

  // Sync isEditingName when autoEditStepName changes (render-time update)
  const [prevAutoEditStepName, setPrevAutoEditStepName] =
    useState(autoEditStepName);
  if (autoEditStepName !== prevAutoEditStepName) {
    setPrevAutoEditStepName(autoEditStepName);
    if (autoEditStepName) {
      setIsEditingName(true);
    }
  }

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

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: step.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const [minVal, setMinVal] = useState(() => (step.minSelections ?? 0).toString());
  const [maxVal, setMaxVal] = useState(() => (step.maxSelections ?? 1).toString());
  const [incVal, setIncVal] = useState(() => (step.includedCount ?? 0).toString());

  // Sync props to local state if they change externally
  useEffect(() => {
    setMinVal((step.minSelections ?? 0).toString());
    setMaxVal((step.maxSelections ?? 1).toString());
    setIncVal((step.includedCount ?? 0).toString());
  }, [step.minSelections, step.maxSelections, step.includedCount]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-transparent flex flex-col border border-primary-foreground/20 rounded-xl overflow-hidden"
    >
      {/* Step Header */}
      <div
        className={cn(
          "flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-3 transition-colors cursor-pointer hover:bg-primary-foreground/5 border-b",
          isExpanded ? "border-primary-foreground/20" : "border-transparent",
        )}
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 -m-1 focus-visible:outline-none shrink-0"
          >
            <DotsSixVertical
              className="w-4 h-4 text-primary-foreground/50 shrink-0"
              weight="bold"
            />
          </div>
          <div
            role="presentation"
            className="flex items-center gap-2 flex-1 min-w-0"
            onMouseDown={(e) => isEditingName && e.stopPropagation()}
          >
            {isEditingName ? (
              <div
                className="flex items-center gap-1.5 flex-1 w-full sm:max-w-xs"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <Input
                  autoFocus
                  value={step.name}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                  onFocus={(e) => e.target.select()}
                  onBlur={finishEditingName}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") finishEditingName();
                    if (e.key === "Escape") finishEditingName();
                  }}
                  maxLength={100}
                  className="h-8 text-sm font-medium bg-transparent border-primary-foreground/30 text-primary-foreground px-2 flex-1"
                  placeholder={t("stepName")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={finishEditingName}
                  className="h-8 w-8 text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10 shrink-0"
                  title={t("save")}
                >
                  <Check
                    className="w-4 h-4 text-primary-foreground"
                    weight="bold"
                  />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 min-w-0 group flex-1">
                <span className="font-semibold text-sm truncate text-primary-foreground">
                  {step.name || t("stepName")}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingName(true);
                  }}
                >
                  <PencilSimple className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div
          className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 w-full sm:w-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <Switch
              checked={step.available ?? true}
              onCheckedChange={(checked) => onUpdate({ available: checked })}
              className="shrink-0 data-[checked]:!bg-primary-foreground data-[unchecked]:!bg-primary-foreground/20 [&_[data-slot=switch-thumb]]:data-[checked]:!bg-primary [&_[data-slot=switch-thumb]]:data-[unchecked]:!bg-primary-foreground"
            />
            <span className="text-xs text-primary-foreground/70 font-medium hidden sm:inline">
              {step.options.length} {t("options")}
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onRemove}
            className="gap-1.5 font-medium text-xs bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors shrink-0"
          >
            <Trash className="w-3.5 h-3.5 shrink-0" weight="bold" />
            <span>{t("delete")}</span>
          </Button>
        </div>
      </div>

      {/* Step Content */}
      {isExpanded && (
        <div className="px-3.5 sm:px-4 py-4 flex flex-col gap-4">
          {/* Step Settings - Single 3-column row on all screen sizes */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={`step-min-${step.id}`}
                className="text-xs font-medium text-primary-foreground/70 flex items-center gap-1"
              >
                {t("minSelections")}
                <TooltipProvider delay={200}>
                  <Tooltip>
                    <TooltipTrigger className="hidden sm:inline-flex items-center">
                      <Info className="w-3.5 h-3.5 text-primary-foreground/40 hover:text-primary-foreground transition-colors cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">{t("minSelectionsDesc" as any)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <Input
                id={`step-min-${step.id}`}
                type="number"
                min={0}
                max={99}
                value={minVal}
                onChange={(e) => {
                  setMinVal(e.target.value);
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) {
                    let newMax = parseInt(maxVal) || 0;
                    if (val > newMax) {
                      newMax = val;
                      setMaxVal(newMax.toString());
                    }
                    onUpdate({ minSelections: val, maxSelections: newMax });
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === "") {
                    setMinVal("0");
                    onUpdate({ minSelections: 0 });
                  }
                }}
                className="w-full text-center bg-transparent border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 h-9 sm:h-8"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={`step-max-${step.id}`}
                className="text-xs font-medium text-primary-foreground/70 flex items-center gap-1"
              >
                {t("maxSelections")}
                <TooltipProvider delay={200}>
                  <Tooltip>
                    <TooltipTrigger className="hidden sm:inline-flex items-center">
                      <Info className="w-3.5 h-3.5 text-primary-foreground/40 hover:text-primary-foreground transition-colors cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">{t("maxSelectionsDesc" as any)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <Input
                id={`step-max-${step.id}`}
                type="number"
                min={1}
                max={99}
                value={maxVal}
                onChange={(e) => {
                  setMaxVal(e.target.value);
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) {
                    let newMin = parseInt(minVal) || 0;
                    if (val < newMin) {
                      newMin = val;
                      setMinVal(newMin.toString());
                    }
                    onUpdate({ maxSelections: val, minSelections: newMin });
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === "") {
                    setMaxVal("1");
                    onUpdate({ maxSelections: 1 });
                  }
                }}
                className="w-full text-center bg-transparent border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 h-9 sm:h-8"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={`step-inc-${step.id}`}
                className="text-xs font-medium text-primary-foreground/70 flex items-center gap-1"
              >
                {t("includedInPrice")}
                <TooltipProvider delay={200}>
                  <Tooltip>
                    <TooltipTrigger className="hidden sm:inline-flex items-center">
                      <Info className="w-3.5 h-3.5 text-primary-foreground/40 hover:text-primary-foreground transition-colors cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">
                        {t("includedInPriceDesc" as any)}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <Input
                id={`step-inc-${step.id}`}
                type="number"
                min={0}
                max={99}
                value={incVal}
                onChange={(e) => {
                  setIncVal(e.target.value);
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) {
                    onUpdate({ includedCount: val });
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === "") {
                    setIncVal("0");
                    onUpdate({ includedCount: 0 });
                  }
                }}
                className="w-full text-center bg-transparent border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 h-9 sm:h-8"
              />
            </div>
          </div>

          <Separator className="bg-primary-foreground/20" />

          {/* Options */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-primary-foreground">
              {t("options")}
            </span>
            {step.options.length === 0 ? (
              <p className="text-sm text-primary-foreground/50 py-3 text-center">
                {t("noOptions")}
              </p>
            ) : (
              <DndContext
                id={`step-options-dnd-${step.id}`}
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => {
                  const { active, over } = event;
                  if (over && active.id !== over.id) {
                    const oldIndex = step.options.findIndex(
                      (o) => o.id === active.id,
                    );
                    const newIndex = step.options.findIndex(
                      (o) => o.id === over.id,
                    );
                    onUpdate({
                      options: arrayMove(step.options, oldIndex, newIndex).map(
                        (o, i) => ({ ...o, sortOrder: i }),
                      ),
                    });
                  }
                }}
              >
                <SortableContext
                  items={step.options.map((o) => o.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-2">
                    {step.options.map((option, optIndex) => (
                      <OptionRow
                        key={option.id || `opt-${optIndex}`}
                        option={option}
                        optionIndex={optIndex}
                        disabled={step.available === false}
                        autoFocusName={autoEditOptionId === option.id}
                        onEditComplete={onEditOptionComplete}
                        onUpdate={(updates) =>
                          onUpdateOption(option.id, updates)
                        }
                        onRemove={() => onRemoveOption(option.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
            <Button
              type="button"
              variant="ghost"
              className="w-full border border-dashed border-primary-foreground/40 hover:border-primary-foreground font-semibold text-sm text-primary-foreground hover:text-primary-foreground bg-transparent hover:bg-primary-foreground/15 gap-2 transition-colors cursor-pointer"
              onClick={onAddOption}
            >
              <Plus className="w-4 h-4 shrink-0" weight="bold" />
              <span>{t("addOption")}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface OptionRowProps {
  option: CustomizationOption;
  optionIndex: number;
  disabled?: boolean;
  autoFocusName?: boolean;
  onEditComplete?: () => void;
  onUpdate: (updates: Partial<CustomizationOption>) => void;
  onRemove: () => void;
}

function OptionRow({
  option,
  optionIndex,
  disabled = false,
  autoFocusName = false,
  onEditComplete,
  onUpdate,
  onRemove,
}: OptionRowProps) {
  const { t } = useTranslation();

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: option.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col sm:flex-row sm:items-center gap-2.5 p-3 rounded-lg border transition-colors bg-transparent border-primary-foreground/20"
    >
      {/* Line 1 (Mobile): Drag handle + Option Name Input (100% width) */}
      <div className="flex items-center gap-2 w-full flex-1 min-w-0">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing shrink-0 focus-visible:outline-none p-1"
        >
          <DotsSixVertical
            className="w-4 h-4 text-primary-foreground/50"
            weight="bold"
          />
        </div>
        <Input
          autoFocus={autoFocusName}
          value={option.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          onFocus={(e) => e.target.select()}
          onBlur={onEditComplete}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") onEditComplete?.();
            if (e.key === "Escape") onEditComplete?.();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder={t("optionName")}
          maxLength={100}
          className="h-9 sm:h-8 text-sm bg-transparent border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 flex-1"
        />
      </div>

      {/* Lines 2 & 3 (Mobile): Price right-aligned in Line 2, Slider left & Delete right in Line 3 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
        {/* Line 2 (Mobile): Price Input right-aligned */}
        <div className="flex justify-end sm:justify-start w-full sm:w-auto">
          <div className="relative w-full sm:w-28">
            <Input
              type="number"
              step="0.01"
              min="0"
              max="99999"
              value={
                option.extraPrice === 0
                  ? ""
                  : (option.extraPrice / 100).toFixed(2)
              }
              onChange={(e) => {
                const val = e.target.value;
                if (val.length > 8) return;
                onUpdate({
                  extraPrice: val ? Math.round(parseFloat(val) * 100) : 0,
                });
              }}
              placeholder="0,00"
              className="h-9 sm:h-8 text-sm pr-6 text-right sm:text-left bg-transparent border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 w-full"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-primary-foreground/50">
              €
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0">
          <Switch
            checked={option.available ?? true}
            disabled={disabled}
            onCheckedChange={(checked) => onUpdate({ available: checked })}
            className="shrink-0 data-[checked]:!bg-primary-foreground data-[unchecked]:!bg-primary-foreground/20 [&_[data-slot=switch-thumb]]:data-[checked]:!bg-primary [&_[data-slot=switch-thumb]]:data-[unchecked]:!bg-primary-foreground"
          />
          <Button
            type="button"
            variant="outline"
            onClick={onRemove}
            className="gap-1.5 font-medium text-xs bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors shrink-0"
          >
            <Trash className="w-3.5 h-3.5 shrink-0" weight="bold" />
            <span>{t("delete")}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
