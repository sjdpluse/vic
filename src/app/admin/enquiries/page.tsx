import type { Metadata } from "next";
import { AdminPortalNav } from "../admin-portal-nav";
import { EnquiriesConsole } from "./enquiries-console";

export const metadata: Metadata = {
  title: "Enquiries | VIC Premier Construction Team",
  robots: { index: false, follow: false },
};

export default function EnquiriesPage() {
  return (
    <>
      <AdminPortalNav />
      <EnquiriesConsole />
    </>
  );
}
