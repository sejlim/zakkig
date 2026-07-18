import { Metadata } from 'next';
import { MainPage } from '@/components/MainPage';
import { translations } from '@/lib/translations';

const t = translations.en;

export const metadata: Metadata = {
  title: t.metaTitle,
  description: t.metaDescription,
  openGraph: {
    title: t.metaTitle,
    description: t.metaDescription,
    locale: 'en_US',
    alternateLocale: 'de_DE',
    siteName: 'zakkig',
    type: 'website',
    images: [
      {
        url: 'https://www.zakkig.de/full.png',
        width: 1200,
        height: 630,
        alt: 'zakkig Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: t.metaTitle,
    description: t.metaDescription,
    images: ['https://www.zakkig.de/full.png'],
  },
  alternates: {
    canonical: 'https://www.zakkig.de/en/',
    languages: {
      'de': 'https://www.zakkig.de/',
      'en': 'https://www.zakkig.de/en/',
      'x-default': 'https://www.zakkig.de/',
    },
  },
};

export default function Page() {
  return <MainPage />;
}
