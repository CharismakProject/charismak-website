import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Construction Estimator",
  description:
    "Measure construction work, analyse rates and generate professional bills of quantities.",
  applicationName: "Charismak Estimator",
  manifest: "/estimator-manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Charismak Estimator",
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#071E33",
};

export default function EstimatorApplicationLayout({ children }: { children: ReactNode }) {
  return <div data-estimator-app>{children}</div>;
}
