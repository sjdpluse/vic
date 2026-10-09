import type { Metadata } from "next";
import { AdminPortalNav } from "../admin-portal-nav";
import { ConsultationGalleryConsole } from "./consultation-gallery-console";

export const metadata: Metadata = {
  title: "Consultation Gallery Admin | VIC Premier Construction Team",
  robots: { index: false, follow: false },
};

export default function ConsultationGalleryAdminPage() {
  return (
    <>
      <AdminPortalNav />
      <ConsultationGalleryConsole />
    </>
  );
}
