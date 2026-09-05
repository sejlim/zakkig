"use client";
import { useState, useEffect, useCallback } from "react";
import { useLanguageStore } from "@/store/language-store";
import { translations, Locale, TranslationKeys } from "./translations";

export type { Locale, TranslationKeys };
export { translations };

export function useTranslation() {
  const storeLocale = useLanguageStore((state) => state.locale);
  const [locale, setLocale] = useState<Locale>("de");

  useEffect(() => {
    setLocale(storeLocale);
  }, [storeLocale]);

  const t = useCallback(
    (key: TranslationKeys, params?: Record<string, string | number>): string => {
      const dict = translations[locale] || translations.de;
      let text: string =
        (dict as Record<string, string>)[key] ||
        (key as string);
      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          text = text.replace(
            new RegExp(`\\{${paramKey}\\}`, "g"),
            String(paramValue),
          );
        });
      }
      return text;
    },
    [locale],
  );

  return { t, locale };
}

/**
 * Format price from cents to display string.
 */
export function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}
