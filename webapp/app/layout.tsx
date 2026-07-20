import { Poppins, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";

import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "zakkig",
    template: "zakkig: %s",
  },
  description: "Digitales Bestell- und Bezahlsystem für die Gastronomie.",
  icons: {
    icon: "https://www.zakkig.de/icon.png",
    apple: "https://www.zakkig.de/icon.png",
  },
  openGraph: {
    title: "zakkig",
    description: "Digitales Bestell- und Bezahlsystem für die Gastronomie.",
    url: "https://app.zakkig.de",
    siteName: "zakkig",
    images: ["https://www.zakkig.de/og_image.png"],
    locale: "de_DE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "zakkig",
    description: "Digitales Bestell- und Bezahlsystem für die Gastronomie.",
    images: ["https://www.zakkig.de/og_image.png"],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={cn(
        "light antialiased",
        fontMono.variable,
        "font-sans",
        poppins.variable,
      )}
    >
      <body className="bg-background text-foreground">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
