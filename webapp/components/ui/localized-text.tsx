"use client";

import { useTranslation, type TranslationKey } from "@/lib/i18n";

interface LocalizedTextProps {
  tKey: TranslationKey;
  params?: Record<string, string | number>;
  className?: string;
  as?: React.ElementType;
}

export function LocalizedText({ tKey, params, className, as: Component = "span" }: LocalizedTextProps) {
  const { t } = useTranslation();
  return <Component className={className}>{t(tKey, params)}</Component>;
}
