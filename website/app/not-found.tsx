"use client";

import Link from "next/link";
import { useTranslation } from "../lib/i18n";

export default function NotFound() {
  const { t, locale } = useTranslation();
  const isEn = locale === "en";

  return (
    <div className="bg-black text-white min-h-screen flex items-center justify-center px-6">
      <div className="max-w-2xl text-center select-none">
        <h1 className="text-6xl md:text-8xl font-light tracking-tighter mb-4 text-zinc-700 select-none">
          404
        </h1>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-6 text-white leading-tight whitespace-nowrap">
          {t("notFoundTitle")}
        </h2>
        <p className="text-zinc-500 font-light mb-8 text-base sm:text-lg">
          {t("notFoundText")}
        </p>
        <Link
          href={isEn ? "/en" : "/"}
          className="px-6 py-3 bg-white text-black hover:bg-zinc-200 transition-colors duration-200 rounded-full font-semibold inline-block text-sm cursor-pointer"
        >
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
