import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Locale } from "@/lib/i18n";

interface LanguageState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      locale: "de",
      setLocale: (locale) => {
        set({ locale });
        if (typeof document !== "undefined") {
          document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
        }
      },
    }),
    {
      name: "language-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
