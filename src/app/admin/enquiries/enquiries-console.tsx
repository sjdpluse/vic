"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import styles from "./enquiries.module.css";

type Profile = { role: "admin" | "editor" | "viewer" };
type Media = { id: string; storage_path: string; original_name: string | null; mime_type: string | null; size_bytes: number | null };
type Status = "new" | "reviewing" | "contacted" | "closed" | "spam";
type Enquiry = {
  id: string;
  status: Status;
  name: string;
  phone: string | null;
  email: string | null;
  suburb_postcode: string | null;
  service: string | null;
  project_description: string;
  preferred_timeframe: string | null;
  created_at: string;
  notification_status: "not_configured" | "sent" | "failed";
  notified_at: string | null;
  notification_error: string | null;
  enquiry_media: Media[];
};

const statuses: Status[] = ["new", "reviewing", "contacted", "closed", "spam"];

export function EnquiriesConsole() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Profile["role"] | null>(null);
  const [items, setItems] = useState<Enquiry[]>([]);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<Status | "all">("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("enquiries")
      .select("id,status,name,phone,email,suburb_postcode,service,project_description,preferred_timeframe,created_at,notification_status,notified_at,notification_error,enquiry_media(id,storage_path,original_name,mime_type,size_bytes)")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) setMessage(error.message);
    else setItems((data ?? []) as Enquiry[]);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!session) {
      setRole(null);
      setItems([]);
      return;
    }

    let cancelled = false;
    void (async () => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (cancelled) return;
      if (error) {
        setRole(null);
        setMessage(error.message);
        return;
      }

      const nextRole = (profile as Profile | null)?.role ?? null;
      setRole(nextRole);
      if (nextRole === "admin") void load();
    })();

    return () => {
      cancelled = true;
    };
  }, [load, session, supabase]);

  const counts = useMemo(() => Object.fromEntries(statuses.map((status) => [status, items.filter((item) => item.status === status).length])) as Record<Status, number>, [items]);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter !== "all" && item.status !== filter) return false;
      if (!needle) return true;
      return [item.name, item.phone, item.email, item.suburb_postcode, item.service, item.project_description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [filter, items, query]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setAuthBusy(false);
    if (error) setMessage(error.message);
  }

  async function handleSignOut() {
    setAuthBusy(true);
    const { error } = await supabase.auth.signOut();
    setAuthBusy(false);
    if (error) setMessage(error.message);
    else {
      setMessage("");
      setEmail("");
      setPassword("");
    }
  }

  async function updateStatus(id: string, status: Status) {
    const { error } = await supabase.from("enquiries").update({ status }).eq("id", id);
    if (error) setMessage(error.message);
    else await load();
  }

  async function openAttachment(media: Media) {
    const { data, error } = await supabase.storage.from("enquiry-media").createSignedUrl(media.storage_path, 120);
    if (error) return setMessage(error.message);
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  if (!session) {
    return (
      <main className={styles.shell}>
        <form className={styles.login} onSubmit={handleLogin}>
          <p className={styles.eyebrow}>VIC PREMIER / ADMIN PORTAL</p>
          <h1>Sign in</h1>
          <label>
            <span>Email</span>
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            <span>Password</span>
            <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          <button type="submit" disabled={authBusy}>{authBusy ? "Signing in…" : "Sign in"}</button>
          {message ? <p className={styles.authMessage}>{message}</p> : null}
        </form>
      </main>
    );
  }

  if (role === null) return <main className={styles.shell}><p>Loading account…</p></main>;

  if (role !== "admin") {
    return (
      <main className={styles.shell}>
        <div className={styles.accessCard}>
          <p>Admin access is required for enquiries.</p>
          <button type="button" onClick={() => void handleSignOut()} disabled={authBusy}>Sign out</button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header>
        <div>
          <p className={styles.eyebrow}>VIC PREMIER / ADMIN PORTAL</p>
          <h1>Enquiries</h1>
        </div>
        <div className={styles.headerActions}>
          <button onClick={() => void load()} disabled={loading}>{loading ? "Refreshing…" : "Refresh enquiries"}</button>
          <button onClick={() => void handleSignOut()} disabled={authBusy}>{authBusy ? "Signing out…" : "Sign out"}</button>
        </div>
      </header>

      <section className={styles.stats} aria-label="Enquiry status summary">
        {statuses.map((status) => (
          <button key={status} className={filter === status ? styles.activeStat : ""} onClick={() => setFilter(filter === status ? "all" : status)}>
            <span>{status}</span>
            <strong>{counts[status]}</strong>
          </button>
        ))}
      </section>

      <div className={styles.toolbar}>
        <input type="search" placeholder="Search name, contact, suburb, service or project…" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select value={filter} onChange={(event) => setFilter(event.target.value as Status | "all")}>
          <option value="all">All statuses</option>
          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </div>

      {message ? <p className={styles.message}>{message}</p> : null}

      <section className={styles.list}>
        {visible.length === 0 ? (
          <article className={styles.card}><h2>No matching enquiries</h2></article>
        ) : visible.map((item) => (
          <article className={styles.card} key={item.id}>
            <div className={styles.top}>
              <div>
                <span>{new Date(item.created_at).toLocaleString()}</span>
                <h2>{item.name}</h2>
                <p>{item.service || "General enquiry"}{item.suburb_postcode ? ` · ${item.suburb_postcode}` : ""}</p>
              </div>
              <select value={item.status} onChange={(event) => void updateStatus(item.id, event.target.value as Status)} aria-label={`Status for ${item.name}`}>
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </div>

            <p className={styles.description}>{item.project_description}</p>

            <div className={styles.meta}>
              {item.phone ? <a href={`tel:${item.phone}`}>{item.phone}</a> : <span>No phone</span>}
              {item.email ? <a href={`mailto:${item.email}`}>{item.email}</a> : <span>No email</span>}
              <span>{item.preferred_timeframe || "No timeframe"}</span>
              <span>Notification: {item.notification_status}{item.notified_at ? ` · ${new Date(item.notified_at).toLocaleString()}` : ""}</span>
            </div>

            {item.notification_error ? <p className={styles.notificationError}>{item.notification_error}</p> : null}
            {item.enquiry_media.length ? (
              <div className={styles.attachments}>
                {item.enquiry_media.map((media) => <button key={media.id} onClick={() => void openAttachment(media)}>{media.original_name || "Attachment"} ↗</button>)}
              </div>
            ) : null}
          </article>
        ))}
      </section>
    </main>
  );
}
