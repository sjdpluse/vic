import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import "./polish.css";
import "./hero-brand.css";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair-display",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || null;

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: "VIC PREMIER CONSTRUCTION TEAM | Construction & Renovation Melbourne",
  description:
    "Residential and commercial construction and renovation services in Melbourne, including painting, roof restoration, gutters, tiling, rendering and general carpentry.",
  robots: siteUrl
    ? { index: true, follow: true }
    : { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={playfairDisplay.variable}>
      <body>{children}</body>
    </html>
  );
}
