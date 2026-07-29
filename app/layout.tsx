import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Charismak Project Nigeria Limited | Construction & Cost Consultancy",
    template: "%s | Charismak Project Nigeria Limited",
  },
  description:
    "Construction, engineering, renovation, steel fabrication, project management, consultancy and finishing services in Abuja, Nigeria.",
  keywords: [
    "construction company Abuja",
    "quantity surveying Nigeria",
    "building construction Abuja",
    "steel fabrication Nigeria",
    "renovation contractor Abuja",
    "project management construction Nigeria",
  ],
  icons: {
    icon: "/icon.png",
  },
  openGraph: {
    title: "Charismak Project Nigeria Limited",
    description:
      "Construction, engineering, renovation, steel fabrication, project management, consultancy and finishing services in Abuja, Nigeria.",
    url: "https://www.charismakproject.com",
    siteName: "Charismak Project Nigeria Limited",
    locale: "en_NG",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-white text-[#151B22] antialiased">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}