import { Metadata } from "next";
import Link from "next/link";
import {
  PrivacySection1,
  PrivacySection2,
  PrivacySection3,
} from "./PrivacySections";

export const metadata: Metadata = {
  title: "zakkig: Privacy Policy",
  description: "Privacy Policy of zakkig.",
  robots: "noindex, follow",
  alternates: {
    canonical: "https://www.zakkig.de/en/privacy",
  },
  openGraph: {
    locale: "en_US",
    title: "zakkig: Privacy Policy",
    description: "Privacy Policy of zakkig.",
    images: ["/full.jpg"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function Privacy() {
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
          <h1>Privacy Policy</h1>
          <p>Status: July 11, 2026</p>

          <PrivacySection1 />
          <PrivacySection2 />
          <PrivacySection3 />
        </article>
      </div>
    </div>
  );
}
