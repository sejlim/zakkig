import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'zakkig: Legal Notice',
  description: 'Legal Notice of zakkig.',
  robots: 'noindex, follow',
  alternates: {
    canonical: 'https://zakkig.de/en/legal',
  },
  openGraph: {
    locale: 'en_US',
    title: 'zakkig: Legal Notice',
    description: 'Legal Notice of zakkig.',
    images: ['/full.jpg'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function Legal() {
  return (
    <div className="bg-black text-white min-h-screen pt-36 pb-24">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="mb-8">
          <Link
            href="/en"
            className="text-xs md:text-sm tracking-widest font-bold uppercase text-zinc-500 hover:text-white transition-colors duration-200"
          >
            Back to home
          </Link>
        </div>
        <article className="prose-sm prose-invert lg:prose-xl lg:prose-invert focus:outline-none">
          <h1>Legal Notice</h1>
          <p>Information provided according to § 5 DDG</p>
          <p>
            Selim Eser
            <br />
            Dannstadter Straße 6-8
            <br />
            68199 Mannheim
            <br />
            Germany
          </p>
          <p>
            <strong>Represented by:</strong>
            <br />
            Selim Eser
          </p>
          <p>
            <strong>Contact:</strong>
            <br />
            Phone:{' '}
            <a href="tel:+4962186037315" className="text-white hover:underline">
              +49-621 86037315
            </a>
            <br />
            Email:{' '}
            <a
              href="mailto:selim@zakkig.de"
              className="text-white hover:underline"
            >
              selim@zakkig.de
            </a>
          </p>
          <p>
            <strong>
              Consumer dispute resolution / Universal arbitration board
            </strong>
            <br />
            We do not participate in dispute resolution proceedings before a
            consumer arbitration board and are not obliged to do so.
          </p>
          <p>
            Privacy Policy:{' '}
            <a
              href="https://zakkig.de/en/privacy"
              className="text-white hover:underline"
            >
              https://www.zakkig.de/en/privacy
            </a>
          </p>
        </article>
      </div>
    </div>
  );
}
