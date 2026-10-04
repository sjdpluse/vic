"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import styles from "./enquiries.module.css";

type Profile = { role: "admin" | "editor" | "viewer" };
type Media = { id: string; storage_path: string; original_name: string | null; mime_type: string | null; size_bytes: number | null };
type Enquiry = {
  id: string;
  status: "new" | "reviewing" | "contacted" | "closed" | "spam";
  name: string;
  phone: string | null;
  email: string | null;
  suburb_postcode: string | null;
  service: string | null;
  project_description: string;
  preferred_timeframe: string | null;
  created_at: string;
  enquiry_media: Media[];
};

const statuses: Enquiry["status"][] = ["new", "reviewing", "contacted", "closed", "spam"];

export function EnquiriesConsole() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Profile["role"] | null>(null);
  const [items, setItems] = useState<Enquiry[]>([]);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("enquiries")
      .select("id,status,name,phone,email,suburb_postcode,service,project_description,preferred_timeframe,created_at,enquiry_media(id,storage_path,original_name,mime_type,size_bytes)")
      .order("created_at", { ascending: false });
    if (error) setMessage(error.message);
    else setItems((data ?? []) as Enquiry[]);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (!data.session) return;
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.session.user.id).single();
      const nextRole = (profile as Profile | null)?.role ?? null;
      setRole(nextRole);
      if (nextRole === "admin") void load();
    });
  }, [load, supabase]);

  async function updateStatus(id: string, status: Enquiry["status"]) {
    const { error } = await supabase.from("enquiries").update({ status }).eq("id", id);
    if (error) setMessage(error.message);
    else await load();
  }

  async function openAttachment(media: Media) {
    const { data, error } = await supabase.storage.from("enquiry-media").createSignedUrl(media.storage_path, 120);
    if (error) return setMessage(error.message);
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  if (!session) return <main className={styles.shell}><p>Sign in through <a href="/admin">/admin</a> first.</p></main>;
  if (role === null) return <main className={styles.shell}><p>Loading account…</p></main>;
  if (role !== "admin") return <main className={styles.shell}><p>Admin access is required for enquiries.</p></main>;

  return (
    <main className={styles.page}>
      <header><div><p className={styles.eyebrow}>VIC PREMIER / ADMIN</p><h1>Enquiries</h1></div><a href="/admin">Projects CMS ↗</a></header>
      {message ? <p className={styles.message}>{message}</p> : null}
      <section className={styles.list}>
        {items.length === 0 ? <article className={styles.card}><h2>No enquiries yet</h2></article> : items.map((item) => (
          <article className={styles.card} key={item.id}>
            <div className={styles.top}><div><span>{new Date(item.created_at).toLocaleString()}</span><h2>{item.name}</h2><p>{item.service || "General enquiry"}{item.suburb_postcode ? ` · ${item.suburb_postcode}` : ""}</p></div><select value={item.status} onChange={(event) => void updateStatus(item.id, event.target.value as Enquiry["status"])}>{statuses.map((status)=><option key={status}>{status}</option>)}</select></div>
            <p className={styles.description}>{item.project_description}</p>
            <div className={styles.meta}><span>{item.phone || "No phone"}</span><span>{item.email || "No email"}</span><span>{item.preferred_timeframe || "No timeframe"}</span></div>
            {item.enquiry_media.length ? <div className={styles.attachments}>{item.enquiry_media.map((media)=><button key={media.id} onClick={() => void openAttachment(media)}>{media.original_name || "Attachment"} ↗</button>)}</div> : null}
          </article>
        ))}
      </section>
    </main>
  );
}
