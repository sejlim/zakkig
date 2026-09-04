import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Checks whether an item's customizations include any option that increases the price above the base price.
 */
export function hasPaidCustomizations(customizations?: string | null): boolean {
  if (!customizations) return false;
  try {
    const steps = JSON.parse(customizations);
    if (!Array.isArray(steps) || steps.length === 0) return false;
    return steps.some((step: any) => {
      if (!Array.isArray(step.options)) return false;
      return step.options.some((opt: any) => {
        const extra =
          typeof opt.extraPrice === "number"
            ? opt.extraPrice
            : typeof opt.price === "number"
            ? opt.price
            : typeof opt.priceAdjustment === "number"
            ? opt.priceAdjustment
            : 0;
        return extra > 0;
      });
    });
  } catch {
    return false;
  }
}

