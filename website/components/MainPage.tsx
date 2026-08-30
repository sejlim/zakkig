"use client";

import Link from "next/link";
import { useTranslation } from "../lib/i18n";
import { RegisterCta } from "./RegisterCta";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { QrCodeShowcase } from "./QrCodeShowcase";

export function MainPage() {
  const { t } = useTranslation();

  return (
    <div className="w-full">
      {/* 1. HERO SECTION (Dark Mode - Black Background) */}
      <section className="relative min-h-[100dvh] flex items-center justify-center bg-black overflow-hidden">
        {/* Ambient Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/hero_video_poster.png"
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-50 pointer-events-none"
        >
          <source src="/hero_video.mp4" type="video/mp4" />
        </video>

        {/* Fallback overlay in case video is missing */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 z-0 pointer-events-none" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-10 pt-32 pb-24 flex flex-col items-start justify-center text-left">
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-semibold tracking-tighter leading-[1.03] max-w-[16ch] mb-8 text-white">
            {t("heroTitle")}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-zinc-400 font-light max-w-[54ch] leading-relaxed mb-12">
            {t("heroSubline")}
          </p>
          <RegisterCta />
        </div>
      </section>

      {/* 2. PAIN POINTS SECTION (Light Mode - White Background) */}
      <section className="bg-white text-black py-24 md:py-36">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left side: Waiting Line Image */}
            <div className="lg:col-span-5 flex justify-center lg:justify-start self-stretch">
              <div className="relative w-full aspect-[3/4] lg:aspect-auto lg:h-full max-w-md lg:max-w-none rounded-[2rem] overflow-hidden min-h-[460px] sm:min-h-[540px] lg:min-h-[580px]">
                <Image
                  src="/waiting_line.png"
                  alt={t("waitingLineImageAlt")}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover object-center"
                  priority
                />
              </div>
            </div>

            {/* Right side: text starts at column 7 */}
            <div className="lg:col-start-7 lg:col-span-6 flex flex-col items-start text-left">
              <h2 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tighter leading-tight mb-8">
                {t("painTitle")
                  .split("\n")
                  .map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-zinc-600 font-light leading-relaxed max-w-[52ch]">
                {t("painText")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DIE LÖSUNG SECTION (Dark Mode - Black Background) */}
      <section className="bg-black text-white py-24 md:py-36">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          {/* Headline & Intro Text */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-24 mb-24 md:mb-32">
            <div>
              <h2 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tighter leading-tight mb-6">
                {t("solutionTitle")}
              </h2>
            </div>
            <div className="flex flex-col gap-6">
              <p className="text-base sm:text-lg md:text-xl text-zinc-400 font-light leading-relaxed">
                {t("solutionIntro")}
              </p>
              <p className="text-base sm:text-lg md:text-xl text-zinc-500 font-light leading-relaxed">
                {t("solutionPrereq")}
              </p>
            </div>
          </div>

          {/* 3.1 zakkig auf einen Blick */}
          <div className="mb-24 md:mb-32">
            <h3 className="text-2xl md:text-4xl font-semibold tracking-tight mb-8 pb-4">
              {t("glanceTitle")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="flex flex-col">
                <h4 className="text-xl font-medium mb-3 text-white">
                  {t("glanceYouTitle")}
                </h4>
                <p className="text-zinc-400 font-light text-sm sm:text-base leading-relaxed">
                  {t("glanceYouText")}
                </p>
              </div>
              <div className="flex flex-col">
                <h4 className="text-xl font-medium mb-3 text-white">
                  {t("glanceCustomersTitle")}
                </h4>
                <p className="text-zinc-400 font-light text-sm sm:text-base leading-relaxed">
                  {t("glanceCustomersText")}
                </p>
              </div>
              <div className="flex flex-col">
                <h4 className="text-xl font-medium mb-3 text-white">
                  {t("glanceKitchenTitle")}
                </h4>
                <p className="text-zinc-400 font-light text-sm sm:text-base leading-relaxed">
                  {t("glanceKitchenText")}
                </p>
              </div>
            </div>
          </div>

          {/* 3.2 In 3 einfachen Schritten startklar */}
          <div className="mb-8 md:mb-12">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-7 xl:col-span-8">
                <h3 className="mb-12 text-2xl font-semibold tracking-tight md:text-4xl">
                  {t("stepsTitle")}
                </h3>
                <div className="flex flex-col gap-10">
                  <div className="flex flex-col gap-3">
                    <h4 className="text-xl font-medium text-white">{t("step1Title")}</h4>
                    <p className="max-w-[40ch] text-sm font-light leading-relaxed text-zinc-400 sm:text-base">{t("step1Text")}</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <h4 className="text-xl font-medium text-white">{t("step2Title")}</h4>
                    <p className="max-w-[40ch] text-sm font-light leading-relaxed text-zinc-400 sm:text-base">{t("step2Text")}</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <h4 className="text-xl font-medium text-white">{t("step3Title")}</h4>
                    <p className="max-w-[40ch] text-sm font-light leading-relaxed text-zinc-400 sm:text-base">{t("step3Text")}</p>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-5 xl:col-span-4 flex justify-center lg:justify-end">
                <QrCodeShowcase />
              </div>
            </div>
          </div>

          {/* 3.3 Buchhaltung und faires Preismodell */}
          <div className="pt-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
              <div>
                <h4 className="text-2xl font-semibold tracking-tight mb-4 text-white">
                  {t("accountingTitle")}
                </h4>
                <p className="text-zinc-400 font-light text-sm sm:text-base leading-relaxed">
                  {t("accountingText")}
                </p>
              </div>
              <div>
                <h4 className="text-2xl font-semibold tracking-tight mb-4 text-white">
                  {t("pricingTitle")}
                </h4>
                <p className="text-zinc-400 font-light text-sm sm:text-base leading-relaxed">
                  {t("pricingText")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ABOUT US SECTION (Light Mode - White Background) */}
      <section className="bg-white text-black py-24 md:py-36">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left side: Photo Placeholder & MARS Logo */}
            <div className="lg:col-span-5 flex justify-center lg:justify-start">
              <div className="w-full max-w-md lg:max-w-none flex flex-col items-center gap-6">
                <div className="aspect-[3/4] w-full bg-zinc-100 flex flex-col items-center justify-center text-zinc-400 font-light text-sm rounded-[2rem] min-h-[460px] sm:min-h-[540px] lg:min-h-[580px]">
                  <span>{t("portraitPlaceholderText")}</span>
                </div>
                {/* Trust Badge - MARS Logo */}
                <a
                  href="https://launchtomars.de/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Image
                    src="/mars_full.svg"
                    alt={t("marsLogoAlt")}
                    width={200}
                    height={64}
                    className="h-16 w-auto object-contain block filter grayscale brightness-50 hover:grayscale-0 hover:brightness-100 transition-all duration-300"
                  />
                </a>
              </div>
            </div>

            {/* Right side: Story (starts at column 7) */}
            <div className="lg:col-start-7 lg:col-span-6 flex flex-col items-start text-left">
              <h2 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tighter leading-tight mb-8 max-w-[20ch]">
                {t("aboutTitle")}
              </h2>
              <div className="space-y-6 text-zinc-600 font-light leading-relaxed text-base sm:text-lg md:text-xl max-w-[52ch]">
                <p>{t("aboutText")}</p>
                <p>{t("trustText")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER WAITLIST SECTION (Dark Mode - Black Background) */}
      <section className="bg-black text-white pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="pb-20 mb-12 flex flex-col gap-10">
            <div className="flex flex-col gap-6">
              <h2 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tighter leading-tight">
                {t("footerTitle")
                  .split("\n")
                  .map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
              </h2>
              <p className="max-w-[58ch] text-base font-light leading-relaxed text-zinc-400 sm:text-lg md:text-xl">
                {t("footerText")
                  .split("\n")
                  .map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
              </p>
            </div>

            <RegisterCta />

            <div className="pt-4 flex flex-col gap-2 items-end text-right">
              <p className="text-zinc-500 font-light text-base sm:text-lg md:text-xl">
                {t("footerContact")}
              </p>
              <a
                href="mailto:selim@zakkig.de"
                className="text-white hover:underline text-2xl sm:text-4xl md:text-5xl font-normal tracking-tight"
              >
                selim@zakkig.de
              </a>
            </div>
          </div>

          {/* Legal Footer Links */}
          <div className="flex items-end justify-between gap-4 text-sm text-zinc-500 font-light md:items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center cursor-pointer hover:opacity-80 transition-opacity duration-200 bg-transparent hover:bg-transparent min-w-0 w-auto h-auto min-h-0 p-0"
              aria-label={t("scrollToTopLabel")}
            >
              <Image
                src="/full.svg"
                alt="zakkig Logo"
                width={120}
                height={40}
                className="h-9 md:h-10 w-auto block"
                style={{ filter: "brightness(0) invert(1)" }}
              />
            </Button>
            <div className="flex flex-col items-end gap-1 text-right text-sm md:flex-row md:gap-8 md:text-base tracking-widest">
              <Link
                href={t("legalUrl" as any)}
                className="font-bold uppercase hover:text-white transition-colors duration-200"
              >
                {t("legalLink")}
              </Link>
              <Link
                href={t("privacyUrl" as any)}
                className="font-bold uppercase hover:text-white transition-colors duration-200"
              >
                {t("privacyLink")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
