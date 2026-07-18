import { Poppins, Geist_Mono } from "next/font/google"
import type { Metadata } from "next"

import "./globals.css"
import { cn } from "@/lib/utils"
import { ToastProvider } from "@/components/toast-provider"

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: {
    default: "zakkig",
    template: "zakkig: %s",
  },
  description: "Smartes Bestell- und Bezahlsystem für die Gastronomie.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="de"
      className={cn("antialiased", fontMono.variable, "font-sans", poppins.variable)}
    >
      <body className="bg-background text-foreground">
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}
