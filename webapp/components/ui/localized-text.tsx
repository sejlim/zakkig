"use client";

import { useTranslation, type TranslationKeys } from "@/lib/i18n";
import { type ComponentProps } from "react";

export interface LocalizedTextProps extends Omit<ComponentProps<"span">, "children"> {
  tKey: TranslationKeys;
  params?: Record<string, string | number>;
  className?: string;
  as?: React.ElementType;
}

export function LocalizedText({
  tKey,
  params,
  className,
  as: Component = "span",
}: LocalizedTextProps) {
  const { t } = useTranslation();
  return <Component className={className}>{t(tKey, params)}</Component>;
}
