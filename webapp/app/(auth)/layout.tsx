import type { Metadata } from "next"
import Image from "next/image"
import { LanguageSwitcher } from "@/components/language-switcher"

export const metadata: Metadata = {
  title: "Authentifizierung",
  description: "Anmelden, registrieren oder Passwort zurücksetzen.",
}

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-[500px] flex flex-col">
        {children}
      </div>
    </div>
  )
}
