"use client";

import { useLanguageStore } from "@/store/language-store";
import { Button } from "@/components/ui/button";
import { Globe } from "@phosphor-icons/react";

export function LanguageSwitcher({
  className,
  variant = "outline",
  size = "default",
}: {
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
}) {
  const { locale, setLocale } = useLanguageStore();

  const toggleLanguage = () => {
    setLocale(locale === "de" ? "en" : "de");
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`gap-2 ${className || ""}`}
      onClick={toggleLanguage}
    >
      <Globe weight="regular" className={size === "sm" ? "w-4 h-4" : ""} />
      <span suppressHydrationWarning>{locale.toUpperCase()}</span>
    </Button>
  );
}
