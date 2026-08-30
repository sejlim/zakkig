"use client";

import { useEffect, useRef, useState } from "react";
import { ReactQRCode } from "@lglab/react-qr-code";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const DEMO_URL = "https://app.zakkig.de/";

/**
 * Flip showcase for the "QR-Codes auslegen" step. Front: takeout code,
 * back: table 1 code. The printed faces reproduce the webapp dashboard
 * print card 1:1 (see webapp/components/dashboard/overview-content.tsx):
 * "Menü & Bestellen / an TISCH 1 / MIT [QR]" — only the QR value differs
 * (demo link to app.zakkig.de).
 */

function ScaledText({ text, className }: { text: string; className?: string }) {
  const textRef = useRef<SVGTextElement>(null);
  const [viewBox, setViewBox] = useState(() => {
    const estWidth = Math.max(text.length * 15, 50);
    return `0 -15 ${estWidth} 30`;
  });

  useEffect(() => {
    if (textRef.current) {
      try {
        const bbox = textRef.current.getBBox();
        setViewBox(`${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
      } catch {}
    }
  }, [text]);

  return (
    <svg viewBox={viewBox} className={cn("w-full block overflow-visible", className)}>
      <text
        ref={textRef}
        x="0"
        y="0"
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        className="font-black uppercase tracking-tighter"
      >
        {text}
      </text>
    </svg>
  );
}

function QrFace({
  title1,
  title2,
  contextWord,
  contextValue,
  withWord,
}: {
  title1: string;
  title2: string;
  contextWord: string;
  contextValue: string;
  withWord: string;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-[2px] text-black">
      <div className="flex w-[78%] flex-col gap-[2px] text-center">
        <ScaledText text={`${title1} ${title2}`} />
        <p className="w-full text-right text-base leading-none font-black uppercase">{contextWord}</p>
        <ScaledText text={contextValue} />
        <p className="w-full text-left text-base leading-none font-black uppercase">{withWord}</p>
      </div>

      <div className="overflow-hidden rounded-xl bg-white [&_svg]:block [&_svg]:[shape-rendering:crispEdges]">
        <ReactQRCode
          value={DEMO_URL}
          size={280}
          level="H"
          background="#FFFFFF"
          dataModulesSettings={{ color: "#000000", style: "square-sm" }}
          finderPatternOuterSettings={{ color: "#000000", style: "square" }}
          finderPatternInnerSettings={{ color: "#000000", style: "square" }}
          imageSettings={{
            src: "https://www.zakkig.de/full_qr.png",
            height: 50,
            width: 157,
            excavate: true,
          }}
        />
      </div>
    </div>
  );
}

export function QrCodeShowcase() {
  const { t } = useTranslation();
  const [showTable, setShowTable] = useState(false);
  const cardClass =
    "absolute left-0 top-0 h-[480px] w-[312px] rounded-[16px] border border-black/10 bg-white p-4";

  const activeFace = showTable ? (
    <QrFace
      title1={t("qrPrintTitle1")}
      title2={t("qrPrintTitle2")}
      contextWord={t("qrPrintAt")}
      contextValue={t("qrPrintTable")}
      withWord={t("qrPrintWith")}
    />
  ) : (
    <QrFace
      title1={t("qrPrintTitle1")}
      title2={t("qrPrintTitle2")}
      contextWord={t("qrPrintFor")}
      contextValue={t("qrPrintPickup")}
      withWord={t("qrPrintWith")}
    />
  );

  return (
    <div className="flex flex-col items-start gap-5" aria-live="polite">
      <div className="relative h-[492px] w-[324px]">
        <div
          className={`${cardClass} z-0 translate-x-3 translate-y-3 border-zinc-300 bg-zinc-100 shadow-none`}
          aria-hidden="true"
        />
        <div
          className={`${cardClass} z-10 shadow-[0_18px_42px_-18px_rgba(0,0,0,0.65)]`}
        >
          <div
            key={showTable ? "table" : "pickup"}
            className="h-full w-full animate-in fade-in zoom-in-[0.985] duration-300"
          >
            {activeFace}
          </div>
        </div>
      </div>
      <nav
        aria-label={t("qrShowcaseToggleLabel")}
        className="flex w-[324px] justify-end items-center space-x-3 text-sm md:text-base font-bold tracking-widest uppercase text-white"
      >
        <button
          type="button"
          onClick={() => setShowTable(false)}
          aria-pressed={!showTable}
          className={`uppercase transition-opacity duration-200 ${
            !showTable
              ? "opacity-100 underline underline-offset-4 decoration-1 text-white"
              : "opacity-50 hover:opacity-100 text-white"
          }`}
        >
          {t("qrSwitchPickup")}
        </button>
        <span className="opacity-30 text-white" aria-hidden="true">
          /
        </span>
        <button
          type="button"
          onClick={() => setShowTable(true)}
          aria-pressed={showTable}
          className={`uppercase transition-opacity duration-200 ${
            showTable
              ? "opacity-100 underline underline-offset-4 decoration-1 text-white"
              : "opacity-50 hover:opacity-100 text-white"
          }`}
        >
          {t("qrSwitchTable")}
        </button>
      </nav>
    </div>
  );
}
