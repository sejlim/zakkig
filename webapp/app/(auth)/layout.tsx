import type { Metadata } from "next";
import { cookies } from "next/headers";
import { translations, Locale } from "@/lib/translations";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || "de";
  const dict = translations[locale] || translations.de;
  const isEn = locale === "en";
  return {
    title: {
      default: dict.authentication,
      template: "zakkig: %s",
    },
    description: isEn
      ? "Sign in, register or reset your password."
      : "Anmelden, registrieren oder Passwort zurücksetzen.",
  };
}

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-[500px] flex flex-col">{children}</div>
    </div>
  );
}
