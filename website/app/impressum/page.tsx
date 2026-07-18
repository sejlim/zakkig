import { Metadata } from 'next';
import Link from 'next/link';
export const metadata: Metadata = {
  title: 'zakkig: Impressum',
  description: 'Impressum von zakkig.',
  robots: 'noindex, follow',
  alternates: {
    canonical: 'https://www.zakkig.de/impressum',
  },
  openGraph: {
    locale: 'de_DE',
    title: 'zakkig: Impressum',
    description: 'Impressum von zakkig.',
    images: ['/full.jpg'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function Impressum() {
  return (
    <div className="bg-black text-white min-h-screen pt-36 pb-24">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="mb-8">
          <Link
            href="/"
            className="text-xs md:text-sm tracking-widest font-bold uppercase text-zinc-500 hover:text-white transition-colors duration-200"
          >
            Zurück zur Startseite
          </Link>
        </div>
        <article className="prose-sm prose-invert lg:prose-xl lg:prose-invert focus:outline-none">
          <h1>Impressum</h1>
          <p>Angaben gemäß § 5 DDG</p>
          <p>
            Selim Eser
            <br />
            Dannstadter Straße 6-8
            <br />
            68199 Mannheim
          </p>
          <p>
            <strong>Vertreten durch:</strong>
            <br />
            Selim Eser
          </p>
          <p>
            <strong>Kontakt:</strong>
            <br />
            Telefon:{' '}
            <a href="tel:+4962186037315" className="text-white hover:underline">
              +49-621 86037315
            </a>
            <br />
            E-Mail:{' '}
            <a
              href="mailto:selim@zakkig.de"
              className="text-white hover:underline"
            >
              selim@zakkig.de
            </a>
          </p>
          <p>
            <strong>
              Verbraucherstreitbeilegung / Universalschlichtungsstelle
            </strong>
            <br />
            Wir nehmen nicht an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teil und sind dazu auch nicht
            verpflichtet.
          </p>
          <p>
            Datenschutzerklärung:{' '}
            <a
              href="https://www.zakkig.de/datenschutz"
              className="text-white hover:underline"
            >
              https://www.zakkig.de/datenschutz
            </a>
          </p>
        </article>
      </div>
    </div>
  );
}
