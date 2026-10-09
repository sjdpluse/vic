import type { Metadata } from "next";
import { AdminPortalNav } from "../admin-portal-nav";
import { AboutImageConsole } from "./about-image-console";

export const metadata: Metadata = {
  title: "About Image Admin | VIC Premier Construction Team",
  robots: { index: false, follow: false },
};

export default function AboutImageAdminPage() {
  return (
    <>
      <AdminPortalNav />
      <AboutImageConsole />
    </>
  );
}
