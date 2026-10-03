import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VIC PREMIER CONSTRUCTION TEAM | Construction & Renovation Melbourne",
  description:
    "Residential and commercial construction and renovation services in Melbourne, including painting, roof restoration, gutters, tiling, rendering and general carpentry.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
