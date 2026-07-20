"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname() || "";
  const isEn = pathname.startsWith("/en");

  const validPaths = [
    "/",
    "/impressum",
    "/datenschutz",
    "/en",
    "/en/",
    "/en/legal",
    "/en/privacy",
  ];
  const showHeader = validPaths.includes(pathname);

  if (!showHeader) return null;

  let deTarget = "/";
  let enTarget = "/en";

  if (pathname === "/impressum" || pathname === "/en/legal") {
    deTarget = "/impressum";
    enTarget = "/en/legal";
  } else if (pathname === "/datenschutz" || pathname === "/en/privacy") {
    deTarget = "/datenschutz";
    enTarget = "/en/privacy";
  }

  return (
    <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-8 md:px-10 max-w-7xl mx-auto">
      <Link href={isEn ? "/en" : "/"} className="flex items-center">
        <img
          src="/full.svg"
          alt="zakkig Logo"
          className="h-9 md:h-10 w-auto block"
          style={{ filter: "brightness(0) invert(1)" }}
        />
      </Link>
      <nav className="flex items-center space-x-3 text-sm md:text-base tracking-widest font-bold">
        <Link
          href={deTarget}
          className={`transition-opacity duration-200 ${
            !isEn
              ? "opacity-100 underline underline-offset-4 decoration-1 text-white"
              : "opacity-50 hover:opacity-100 text-white"
          }`}
        >
          DE
        </Link>
        <span className="opacity-30 text-white">/</span>
        <Link
          href={enTarget}
          className={`transition-opacity duration-200 ${
            isEn
              ? "opacity-100 underline underline-offset-4 decoration-1 text-white"
              : "opacity-50 hover:opacity-100 text-white"
          }`}
        >
          EN
        </Link>
      </nav>
    </header>
  );
}
