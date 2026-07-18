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
    images: ['/og_image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: t.metaTitle,
    description: t.metaDescription,
    images: ['/og_image.png'],
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
