import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VIC PREMIER CONSTRUCTION TEAM — Experience Prototype",
  description:
    "Cinematic scroll-sequence prototype for VIC PREMIER CONSTRUCTION TEAM.",
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
