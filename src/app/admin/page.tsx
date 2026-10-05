import type { Metadata } from "next";
import { AdminConsole } from "./admin-console";
import { AdminPortalNav } from "./admin-portal-nav";

export const metadata: Metadata = {
  title: "Admin | VIC Premier Construction Team",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <>
      <AdminPortalNav />
      <AdminConsole />
    </>
  );
}
