import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import JsonLd from "@/components/seo/json-ld";
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import SiteChrome from "./components/SiteChrome";
import Footer from "./components/Footer";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Managed website content is intentionally cached and revalidated instead of
// being fetched from Supabase for every request. This keeps the public site
// responsive and friendly to the current free hosting/database tiers.
export const revalidate = 300;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: "Construction Company in Abuja, Nigeria | Charismak Project",
    template: "%s | Charismak Project Nigeria Limited",
  },
  description:
    "Abuja construction company for building construction, civil engineering, renovation, steel fabrication, project management, cost planning and architectural finishing across Nigeria.",
  keywords: [
    "construction company Abuja",
    "construction company Nigeria",
    "building contractor Abuja",
    "building construction Abuja",
    "civil engineering Abuja",
    "quantity surveying Nigeria",
    "construction cost estimator Nigeria",
    "building material prices Nigeria",
    "construction rates Nigeria",
    "steel fabrication Abuja",
    "renovation contractor Abuja",
    "project management construction Nigeria",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Construction",
  referrer: "origin-when-cross-origin",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "Construction Company in Abuja, Nigeria | Charismak Project",
    description:
      "Construction, engineering, renovation, cost planning, steel fabrication and project management services in Abuja and across Nigeria.",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_NG",
    type: "website",
    images: [
      {
        url: absoluteUrl(DEFAULT_OG_IMAGE),
        width: 1200,
        height: 630,
        alt: "Charismak construction project in Nigeria",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Construction Company in Abuja, Nigeria | Charismak Project",
    description:
      "Construction, engineering, renovation, cost planning and project delivery services in Abuja and across Nigeria.",
    images: [absoluteUrl(DEFAULT_OG_IMAGE)],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-white text-[#151B22] antialiased">
        <JsonLd data={[organizationJsonLd, websiteJsonLd]} />
        <SiteChrome footer={<Footer />}>{children}</SiteChrome>
        <Analytics />
      </body>
    </html>
  );
}
