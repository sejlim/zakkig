"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "@phosphor-icons/react";
import { formatPrice, useTranslation } from "@/lib/i18n";
import type { MenuItem, CustomizationStep } from "@/lib/types";

interface CustomizationModalProps {
  item: MenuItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (
    item: MenuItem,
    selections: { stepName: string; optionName: string; extraPrice: number }[],
    totalPrice: number
  ) => void;
}

export function CustomizationModal({
  item,
  open,
  onOpenChange,
  onAddToCart,
}: CustomizationModalProps) {
  const { t } = useTranslation();
  const [steps, setSteps] = useState<CustomizationStep[]>([]);
  const [selections, setSelections] = useState<Record<string, string[]>>({}); // stepName -> optionNames

  useEffect(() => {
    if (item && item.customizations) {
      try {
        const parsedRaw = JSON.parse(item.customizations);
        const parsed: CustomizationStep[] = parsedRaw.map((step: any) => ({
          ...step,
          minSelections: step.minSelections ?? (step.type === "singleChoice" ? 1 : 0),
          maxSelections: step.maxSelections ?? (step.type === "singleChoice" ? 1 : 99),
          includedCount: step.includedCount ?? 0,
        }));
        
        setSteps(parsed);
        
        const initialSelections: Record<string, string[]> = {};
        parsed.forEach((step) => {
          if (step.minSelections > 0 && step.options.length > 0) {
            initialSelections[step.name] = step.options
              .slice(0, step.minSelections)
              .map((o) => o.name);
          } else {
            initialSelections[step.name] = [];
          }
        });
        setSelections(initialSelections);
      } catch (e) {
        setSteps([]);
      }
    } else {
      setSteps([]);
    }
  }, [item]);

  if (!item) return null;

  const getOptionPrice = (opt: any): number => {
    if (typeof opt.extraPrice === "number") return opt.extraPrice;
    if (typeof opt.price === "number") return opt.price;
    return 0;
  };

  const calculateTotal = () => {
    let total = item.price;
    steps.forEach((step) => {
      const selectedOptionNames = selections[step.name] || [];
      const selectedOptions = step.options.filter((o) =>
        selectedOptionNames.includes(o.name)
      );
      
      const sortedOptions = [...selectedOptions].sort(
        (a, b) => getOptionPrice(a) - getOptionPrice(b)
      );
      
      const payableOptions = sortedOptions.slice(step.includedCount || 0);
      payableOptions.forEach((opt) => {
        total += getOptionPrice(opt);
      });
    });
    return total;
  };

  const handleSelect = (stepName: string, optionName: string) => {
    const step = steps.find((s) => s.name === stepName);
    if (!step) return;

    setSelections((prev) => {
      const current = prev[stepName] || [];
      const isSelected = current.includes(optionName);

      if (isSelected) {
        return { ...prev, [stepName]: current.filter((name) => name !== optionName) };
      } else {
        if (step.maxSelections === 1) {
          return { ...prev, [stepName]: [optionName] };
        }
        if (current.length >= step.maxSelections) {
          return prev;
        }
        return { ...prev, [stepName]: [...current, optionName] };
      }
    });
  };

  const handleAdd = () => {
    const finalSelections: { stepName: string; optionName: string; extraPrice: number }[] = [];
    steps.forEach((step) => {
      const selectedOptionNames = selections[step.name] || [];
      const selectedOptions = step.options.filter((o) =>
        selectedOptionNames.includes(o.name)
      );
      
      const sortedOptions = [...selectedOptions].sort(
        (a, b) => getOptionPrice(a) - getOptionPrice(b)
      );
      
      sortedOptions.forEach((opt, index) => {
        finalSelections.push({
          stepName: step.name,
          optionName: opt.name,
          extraPrice: index < (step.includedCount || 0) ? 0 : getOptionPrice(opt),
        });
      });
    });
    onAddToCart(item, finalSelections, calculateTotal());
    onOpenChange(false);
  };

  const isValid = steps.every((step) => {
    const count = (selections[step.name] || []).length;
    return count >= step.minSelections && count <= step.maxSelections;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-t-xl sm:rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{item.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {steps.map((step) => {
            const currentSelections = selections[step.name] || [];
            return (
              <div key={step.name} className="space-y-3">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-semibold text-lg leading-tight">{step.name}</h3>
                  <span className="shrink-0 text-[13px] text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
                    {step.minSelections === step.maxSelections && step.minSelections > 0
                      ? t("chooseExactly" as any, { count: step.minSelections })
                      : step.minSelections > 0
                      ? t("chooseBetween" as any, { min: step.minSelections, max: step.maxSelections })
                      : t("chooseUpTo" as any, { max: step.maxSelections })}
                  </span>
                </div>
                {step.includedCount > 0 && (
                  <p className="text-sm text-primary font-medium mt-[-4px]">
                    {t("includedFirst" as any, { count: step.includedCount })}
                  </p>
                )}
                <div className="space-y-2">
                  {step.options.map((option) => {
                    const isSelected = currentSelections.includes(option.name);
                    const isMaxReached = step.maxSelections > 1 && !isSelected && currentSelections.length >= step.maxSelections;

                    return (
                      <button
                        key={option.name}
                        onClick={() => handleSelect(step.name, option.name)}
                        disabled={isMaxReached}
                        className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : isMaxReached
                            ? "border-border opacity-50 cursor-not-allowed bg-muted/20"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 flex items-center justify-center border ${
                              step.maxSelections === 1 ? "rounded-full" : "rounded-[4px]"
                            } ${
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-input bg-background"
                            }`}
                          >
                            {isSelected && <Check weight="bold" className="w-3 h-3" />}
                          </div>
                          <span className="font-medium text-left">{option.name}</span>
                        </div>
                        {getOptionPrice(option) > 0 && (
                          <span className="text-sm text-muted-foreground pl-3">
                            +{formatPrice(getOptionPrice(option))}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-4 border-t sticky bottom-0 bg-background pb-safe z-10">
          <Button 
            size="lg"
            className="w-full rounded-full font-bold h-12 text-base shadow-md" 
            onClick={handleAdd}
            disabled={!isValid}
          >
            {t("addToCart" as any)} • {formatPrice(calculateTotal())}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
