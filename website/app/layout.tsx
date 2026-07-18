import { Metadata } from 'next';
import { Geist_Mono, Poppins } from "next/font/google"
import { Header } from "@/components/Header"
import { translations } from '@/lib/translations';

const t = translations.de;

export const metadata: Metadata = {
  metadataBase: new URL('https://zakkig.de'),
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: t.metaTitle,
    description: t.metaDescription,
    url: 'https://zakkig.de',
    siteName: 'zakkig',
    images: [
      {
        url: '/full.png',
        width: 1200,
        height: 630,
        alt: 'zakkig Logo',
      },
    ],
    locale: 'de_DE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: t.metaTitle,
    description: t.metaDescription,
    images: ['/full.png'],
  },
};
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

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
      lang="en"
      suppressHydrationWarning
      className={`antialiased ${fontMono.variable} font-sans ${poppins.variable}`}
    >
      <body>
        <ThemeProvider>
          <Header />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
