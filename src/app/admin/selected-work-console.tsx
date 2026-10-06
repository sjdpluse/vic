"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import styles from "./selected-work.module.css";

type Profile = { id: string; role: "admin" | "editor" | "viewer"; display_name: string | null };
type SelectedWorkItem = {
  id: string;
  before_storage_path: string | null;
  after_storage_path: string | null;
  sort_order: number;
  created_at: string;
  before_url: string | null;
  after_url: string | null;
};
type Role = "before" | "after";

export function SelectedWorkConsole() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<SelectedWorkItem[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const isStaff = profile?.role === "admin" || profile?.role === "editor";

  const loadItems = useCallback(async () => {
    const { data, error } = await supabase
      .from("selected_work_items")
      .select("id,before_storage_path,after_storage_path,sort_order,created_at")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) return setMessage(error.message);

    const rows = (data ?? []) as Omit<SelectedWorkItem, "before_url" | "after_url">[];
    const next = await Promise.all(rows.map(async (item) => {
      const [before, after] = await Promise.all([
        item.before_storage_path
          ? supabase.storage.from("project-media").createSignedUrl(item.before_storage_path, 3600)
          : Promise.resolve({ data: null, error: null }),
        item.after_storage_path
          ? supabase.storage.from("project-media").createSignedUrl(item.after_storage_path, 3600)
          : Promise.resolve({ data: null, error: null }),
      ]);
      return { ...item, before_url: before.data?.signedUrl ?? null, after_url: after.data?.signedUrl ?? null };
    }));
    setItems(next);
  }, [supabase]);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from("profiles").select("id,role,display_name").eq("id", userId).single();
    if (error) { setMessage(error.message); setProfile(null); return; }
    setProfile(data as Profile);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user.id) void loadProfile(data.session.user.id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setProfile(null);
      if (nextSession?.user.id) void loadProfile(nextSession.user.id);
    });
    return () => listener.subscription.unsubscribe();
  }, [loadProfile, supabase]);

  useEffect(() => { if (isStaff) void loadItems(); }, [isStaff, loadItems]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false); if (error) setMessage(error.message);
  }

  async function signOut() { await supabase.auth.signOut(); setItems([]); }

  async function addItem() {
    if (!isStaff) return;
    const nextSort = items.length ? Math.max(...items.map((item) => item.sort_order)) + 10 : 10;
    setBusy(true); setMessage("");
    const { error } = await supabase.from("selected_work_items").insert({ sort_order: nextSort });
    setBusy(false);
    if (error) setMessage(error.message);
    else { setMessage("Selected Work card added."); await loadItems(); }
  }

  async function uploadRole(item: SelectedWorkItem, role: Role, file: File) {
    if (!isStaff) return;
    if (!file.type.startsWith("image/")) return setMessage("Selected Work media must be an image.");
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
    const path = `selected-work/${item.id}/${role}-${crypto.randomUUID()}-${safeName}`;
    const field = role === "before" ? "before_storage_path" : "after_storage_path";
    const previousPath = role === "before" ? item.before_storage_path : item.after_storage_path;

    setBusy(true); setMessage("");
    const { error: uploadError } = await supabase.storage.from("project-media").upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (uploadError) { setBusy(false); return setMessage(uploadError.message); }

    const { error: updateError } = await supabase.from("selected_work_items").update({ [field]: path }).eq("id", item.id);
    if (updateError) {
      await supabase.storage.from("project-media").remove([path]);
      setBusy(false); return setMessage(updateError.message);
    }

    if (previousPath) {
      const { error: removeError } = await supabase.storage.from("project-media").remove([previousPath]);
      if (removeError) setMessage(`Image updated, but the previous file could not be removed: ${removeError.message}`);
    }
    setBusy(false);
    setMessage((current) => current || `${role === "before" ? "Before" : "After"} image updated.`);
    await loadItems();
  }

  async function clearRole(item: SelectedWorkItem, role: Role) {
    if (!isStaff) return;
    const field = role === "before" ? "before_storage_path" : "after_storage_path";
    const path = role === "before" ? item.before_storage_path : item.after_storage_path;
    if (!path || !window.confirm(`Delete the ${role} image from this Selected Work card?`)) return;

    setBusy(true); setMessage("");
    const { error: updateError } = await supabase.from("selected_work_items").update({ [field]: null }).eq("id", item.id);
    if (updateError) { setBusy(false); return setMessage(updateError.message); }

    const { error: storageError } = await supabase.storage.from("project-media").remove([path]);
    setBusy(false);
    setMessage(storageError ? `Card updated, but the old file could not be removed: ${storageError.message}` : `${role === "before" ? "Before" : "After"} image deleted.`);
    await loadItems();
  }

  async function deleteItem(item: SelectedWorkItem) {
    if (!isStaff || !window.confirm("Delete this Selected Work card?")) return;
    setBusy(true); setMessage("");
    const { error } = await supabase.from("selected_work_items").delete().eq("id", item.id);
    if (error) { setBusy(false); return setMessage(error.message); }
    const paths = [item.before_storage_path, item.after_storage_path].filter((value): value is string => Boolean(value));
    if (paths.length) {
      const { error: storageError } = await supabase.storage.from("project-media").remove(paths);
      if (storageError) setMessage(`Card deleted, but some files could not be removed: ${storageError.message}`);
    }
    setBusy(false);
    setMessage((current) => current || "Selected Work card deleted.");
    await loadItems();
  }

  async function moveItem(item: SelectedWorkItem, direction: -1 | 1) {
    if (!isStaff) return;
    const index = items.findIndex((candidate) => candidate.id === item.id);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= items.length) return;
    const other = items[swapIndex];
    setBusy(true); setMessage("");
    const { error: firstError } = await supabase.from("selected_work_items").update({ sort_order: other.sort_order }).eq("id", item.id);
    if (firstError) { setBusy(false); return setMessage(firstError.message); }
    const { error: secondError } = await supabase.from("selected_work_items").update({ sort_order: item.sort_order }).eq("id", other.id);
    setBusy(false); if (secondError) setMessage(secondError.message); else await loadItems();
  }

  if (!session) return (
    <main className={styles.shell}>
      <section className={styles.loginCard}>
        <p className={styles.eyebrow}>VIC PREMIER / ADMIN</p>
        <h1>Selected Work</h1>
        <p>Sign in with an approved VIC staff account.</p>
        <form className={styles.form} onSubmit={handleLogin}>
          <label>Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          <button disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
        {message ? <p className={styles.message}>{message}</p> : null}
      </section>
    </main>
  );

  if (!profile) return <main className={styles.shell}><section className={styles.loginCard}>Loading account…</section></main>;

  if (!isStaff) return (
    <main className={styles.shell}>
      <section className={styles.loginCard}>
        <p className={styles.eyebrow}>SIGNED IN</p><h1>Access pending</h1>
        <p>This account is not approved for Selected Work management.</p>
        <button className={styles.secondaryButton} onClick={signOut}>Sign out</button>
      </section>
    </main>
  );

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>VIC PREMIER / ADMIN</p>
          <h1>Selected Work</h1>
          <p className={styles.intro}>Manage only the Before/After cards shown on the landing page. Project titles, slugs, summaries, descriptions, publish states and galleries are not part of this section.</p>
        </div>
        <div className={styles.account}>
          <span>{profile.display_name || session.user.email}</span><small>{profile.role}</small>
          <button className={styles.secondaryButton} onClick={signOut}>Sign out</button>
        </div>
      </header>

      <div className={styles.toolbar}><button onClick={() => void addItem()} disabled={busy}>+ Add Selected Work card</button></div>
      {message ? <p className={styles.globalMessage}>{message}</p> : null}

      <section className={styles.list} aria-label="Selected Work cards">
        {items.length === 0 ? (
          <article className={styles.empty}><h2>No Selected Work cards</h2><p>Add a card, then upload one Before and one After image. Incomplete cards stay hidden from the public landing page.</p></article>
        ) : items.map((item, index) => (
          <article className={styles.card} key={item.id}>
            <div className={styles.cardHeader}>
              <div><span className={styles.index}>Selected Work {String(index + 1).padStart(2, "0")}</span><h2>Before & After</h2></div>
              <div className={styles.cardActions}>
                <button disabled={busy || index === 0} onClick={() => void moveItem(item, -1)} aria-label="Move card up">↑</button>
                <button disabled={busy || index === items.length - 1} onClick={() => void moveItem(item, 1)} aria-label="Move card down">↓</button>
                <button className={styles.dangerButton} disabled={busy} onClick={() => void deleteItem(item)}>Delete card</button>
              </div>
            </div>
            <div className={styles.slots}>
              {(["before", "after"] as const).map((role) => {
                const url = role === "before" ? item.before_url : item.after_url;
                const path = role === "before" ? item.before_storage_path : item.after_storage_path;
                return (
                  <section className={styles.slot} key={role}>
                    <div className={styles.preview}>{url ? <img src={url} alt="" /> : <span>No {role} image</span>}<b>{role}</b></div>
                    <div className={styles.slotActions}>
                      <label className={styles.upload}>
                        <span>{path ? `Replace ${role}` : `Add ${role}`}</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy} onChange={(event) => {
                          const selectedFile = event.target.files?.[0];
                          if (selectedFile) void uploadRole(item, role, selectedFile);
                          event.currentTarget.value = "";
                        }} />
                      </label>
                      {path ? <button className={styles.dangerButton} disabled={busy} onClick={() => void clearRole(item, role)}>Delete image</button> : null}
                    </div>
                  </section>
                );
              })}
            </div>
            <p className={styles.visibility}>{item.before_storage_path && item.after_storage_path ? "Visible on the landing page." : "Hidden from the landing page until both images are added."}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
