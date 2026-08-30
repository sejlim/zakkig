"use client";

import { ArrowUpRight } from "@phosphor-icons/react";
import { useTranslation } from "@/lib/i18n";

export function RegisterCta() {
  const { t } = useTranslation();

  return (
    <div className="w-fit">
      <a
        href={t("registerUrl")}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-semibold text-black transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        {t("registerCta")}
        <ArrowUpRight weight="bold" aria-hidden="true" />
      </a>
    </div>
  );
}
