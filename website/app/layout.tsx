import { Metadata } from 'next';
import { Geist_Mono, Poppins } from "next/font/google"
import { Header } from "@/components/Header"
import { translations } from '@/lib/translations';

const t = translations.de;

export const metadata: Metadata = {
  metadataBase: new URL('https://www.zakkig.de'),
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: t.metaTitle,
    description: t.metaDescription,
    url: 'https://www.zakkig.de',
    siteName: 'zakkig',
    images: ['/og_image.png'],
    locale: 'de_DE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: t.metaTitle,
    description: t.metaDescription,
    images: ['/og_image.png'],
  },
};
import "./globals.css"
import { Toast } from "@heroui/react"

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="de"
      className={`light antialiased ${fontMono.variable} font-sans ${poppins.variable}`}
    >
      <body>
        <Toast.Provider placement="top" />
        <Header />
        {children}
      </body>
    </html>
  )
}
