import type { Metadata } from "next";
import { EnquiriesConsole } from "./enquiries-console";

export const metadata: Metadata = {
  title: "Enquiries | VIC Premier Construction Team",
  robots: { index: false, follow: false },
};

export default function EnquiriesPage() {
  return <EnquiriesConsole />;
}
