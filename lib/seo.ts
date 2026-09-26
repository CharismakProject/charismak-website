import type { Metadata } from "next";

export const SITE_URL = "https://www.charismakproject.com";
export const SITE_NAME = "Charismak Project Nigeria Limited";
export const DEFAULT_OG_IMAGE = "/Images/Projects/coco/hero.jpg";

export const absoluteUrl = (path = "/") => {
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path.startsWith("/") ? path : `/${path}`, SITE_URL).toString();
};

type SeoMetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  imageAlt?: string;
  type?: "website" | "article";
  keywords?: string[];
};

export function createSeoMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  imageAlt,
  type = "website",
  keywords,
}: SeoMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const socialImage = absoluteUrl(image || DEFAULT_OG_IMAGE);

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: "en_NG",
      type,
      images: [
        {
          url: socialImage,
          width: 1200,
          height: 630,
          alt: imageAlt || title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "GeneralContractor",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  alternateName: "Charismak",
  url: SITE_URL,
  logo: absoluteUrl("/Images/logo/logo.png"),
  image: absoluteUrl(DEFAULT_OG_IMAGE),
  description:
    "Nigerian construction company providing building construction, civil engineering, renovation, steel fabrication, project management, technical consultancy, facility maintenance and architectural finishing services.",
  email: "info@charismakproject.com",
  telephone: "+2347066619598",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Sankuru Close, off El-Amin Street",
    addressLocality: "Maitama",
    addressRegion: "Federal Capital Territory",
    addressCountry: "NG",
  },
  areaServed: [
    { "@type": "City", name: "Abuja" },
    { "@type": "Country", name: "Nigeria" },
  ],
  knowsAbout: [
    "Building construction",
    "Civil engineering",
    "Construction cost estimating",
    "Quantity surveying",
    "Project management",
    "Renovation",
    "Steel fabrication",
    "Architectural finishing",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    telephone: "+2347066619598",
    email: "info@charismakproject.com",
    areaServed: "NG",
    availableLanguage: ["English"],
  },
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  alternateName: "Charismak",
  inLanguage: "en-NG",
  publisher: { "@id": `${SITE_URL}/#organization` },
};

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
