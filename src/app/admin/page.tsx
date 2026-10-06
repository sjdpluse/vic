import type { Metadata } from "next";
import { AdminPortalNav } from "./admin-portal-nav";
import { SelectedWorkConsole } from "./selected-work-console";

export const metadata: Metadata = { title: "Selected Work Admin | VIC Premier Construction Team", robots: { index: false, follow: false } };

export default function AdminPage() {
  return <><AdminPortalNav /><SelectedWorkConsole /></>;
}
