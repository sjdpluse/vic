import type { Metadata } from "next";
import { AdminPortalNav } from "../admin-portal-nav";
import { HeroCloudsConsole } from "./hero-clouds-console";

export const metadata: Metadata = {
  title: "Hero Clouds Admin | VIC Premier Construction Team",
  robots: { index: false, follow: false },
};

export default function HeroCloudsAdminPage() {
  return (
    <>
      <AdminPortalNav />
      <HeroCloudsConsole />
    </>
  );
}
