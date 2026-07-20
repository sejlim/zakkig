"use client";

import { usePathname } from "next/navigation";
import { translations, Locale, TranslationKeys } from "./translations";

export function useTranslation() {
  const pathname = usePathname() || "";

  const locale: Locale = pathname.startsWith("/en") ? "en" : "de";

  const t = (key: TranslationKeys): string => {
    return translations[locale][key];
  };

  return { t, locale };
}
