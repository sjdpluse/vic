"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import styles from "./consultation-gallery.module.css";

type Profile = {
  id: string;
  role: "admin" | "editor" | "viewer";
  display_name: string | null;
};

type GalleryItem = {
  id: string;
  storage_path: string;
  sort_order: number;
  created_at: string;
  url: string | null;
};

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export function ConsultationGalleryConsole() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const isStaff = profile?.role === "admin" || profile?.role === "editor";

  const loadItems = useCallback(async () => {
    const { data, error } = await supabase
      .from("consultation_gallery_items")
      .select("id,storage_path,sort_order,created_at")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      setMessage(error.message);
      return;
    }

    const rows = (data ?? []) as Omit<GalleryItem, "url">[];
    const resolved = await Promise.all(
      rows.map(async (item) => {
        const { data: signed } = await supabase.storage
          .from("project-media")
          .createSignedUrl(item.storage_path, 3600);

        return { ...item, url: signed?.signedUrl ?? null };
      }),
    );

    setItems(resolved);
  }, [supabase]);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,role,display_name")
      .eq("id", userId)
      .single();

    if (error) {
      setMessage(error.message);
      setProfile(null);
      return;
    }

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

  useEffect(() => {
    if (isStaff) void loadItems();
  }, [isStaff, loadItems]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setMessage(error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setItems([]);
  }

  async function uploadFiles(event: ChangeEvent<HTMLInputElement>) {
    if (!isStaff) return;

    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;

    const invalid = files.find((file) => !ALLOWED_TYPES.has(file.type) || file.size > MAX_FILE_BYTES);
    if (invalid) {
      setMessage("Use JPG, PNG, WebP or AVIF images up to 20 MB each.");
      return;
    }

    setBusy(true);
    setMessage("");

    let nextSort = items.length ? Math.max(...items.map((item) => item.sort_order)) + 10 : 10;
    let uploaded = 0;

    for (const file of files) {
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
      const path = `consultation-gallery/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("project-media")
        .upload(path, file, {
          contentType: file.type || undefined,
          cacheControl: "31536000",
          upsert: false,
        });

      if (uploadError) {
        setMessage(`Uploaded ${uploaded} image(s). ${uploadError.message}`);
        break;
      }

      const { error: insertError } = await supabase
        .from("consultation_gallery_items")
        .insert({ storage_path: path, sort_order: nextSort });

      if (insertError) {
        await supabase.storage.from("project-media").remove([path]);
        setMessage(`Uploaded ${uploaded} image(s). ${insertError.message}`);
        break;
      }

      uploaded += 1;
      nextSort += 10;
    }

    setBusy(false);
    if (uploaded === files.length) {
      setMessage(`${uploaded} image${uploaded === 1 ? "" : "s"} added to the consultation loop.`);
    }
    await loadItems();
  }

  async function deleteItem(item: GalleryItem) {
    if (!isStaff || !window.confirm("Delete this image from the consultation gallery?")) return;

    setBusy(true);
    setMessage("");

    const { error: deleteError } = await supabase
      .from("consultation_gallery_items")
      .delete()
      .eq("id", item.id);

    if (deleteError) {
      setBusy(false);
      setMessage(deleteError.message);
      return;
    }

    const { error: storageError } = await supabase.storage
      .from("project-media")
      .remove([item.storage_path]);

    setBusy(false);
    setMessage(
      storageError
        ? `Gallery updated, but the file could not be removed from storage: ${storageError.message}`
        : "Image deleted.",
    );
    await loadItems();
  }

  async function moveItem(item: GalleryItem, direction: -1 | 1) {
    if (!isStaff) return;

    const index = items.findIndex((candidate) => candidate.id === item.id);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= items.length) return;

    const other = items[swapIndex];
    setBusy(true);
    setMessage("");

    const { error: firstError } = await supabase
      .from("consultation_gallery_items")
      .update({ sort_order: other.sort_order })
      .eq("id", item.id);

    if (firstError) {
      setBusy(false);
      setMessage(firstError.message);
      return;
    }

    const { error: secondError } = await supabase
      .from("consultation_gallery_items")
      .update({ sort_order: item.sort_order })
      .eq("id", other.id);

    setBusy(false);
    if (secondError) setMessage(secondError.message);
    else await loadItems();
  }

  if (!session) {
    return (
      <main className={styles.shell}>
        <section className={styles.loginCard}>
          <p className={styles.eyebrow}>VIC PREMIER / ADMIN</p>
          <h1>Consultation Gallery</h1>
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
  }

  if (!profile) {
    return <main className={styles.shell}><section className={styles.loginCard}>Loading account…</section></main>;
  }

  if (!isStaff) {
    return (
      <main className={styles.shell}>
        <section className={styles.loginCard}>
          <p className={styles.eyebrow}>SIGNED IN</p>
          <h1>Access pending</h1>
          <p>This account is not approved for consultation gallery management.</p>
          <button className={styles.secondaryButton} onClick={signOut}>Sign out</button>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>VIC PREMIER / ADMIN</p>
          <h1>Consultation Gallery</h1>
          <p className={styles.intro}>
            Upload the images shown on the left side of the consultation page. Multiple images play automatically in this order with a smooth loop transition. Files are stored at their original quality.
          </p>
        </div>
        <div className={styles.account}>
          <span>{profile.display_name || session.user.email}</span>
          <small>{profile.role}</small>
          <button className={styles.secondaryButton} onClick={signOut}>Sign out</button>
        </div>
      </header>

      <div className={styles.toolbar}>
        <label className={styles.uploadButton}>
          <span>{busy ? "Uploading…" : "+ Upload images"}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            disabled={busy}
            onChange={(event) => void uploadFiles(event)}
          />
        </label>
      </div>

      {message ? <p className={styles.globalMessage}>{message}</p> : null}

      {items.length === 0 ? (
        <section className={styles.empty}>
          <h2>No gallery images yet</h2>
          <p>The consultation page will keep using its current fallback image until you upload the first image here.</p>
        </section>
      ) : (
        <section className={styles.grid} aria-label="Consultation gallery images">
          {items.map((item, index) => (
            <article className={styles.card} key={item.id}>
              <div className={styles.preview}>
                {item.url ? <img src={item.url} alt="" /> : <span>Preview unavailable</span>}
                <b>{String(index + 1).padStart(2, "0")}</b>
              </div>
              <div className={styles.cardBody}>
                <div>
                  <strong>Slide {index + 1}</strong>
                  <small>{index === 0 ? "Loads first" : "Loops after previous slide"}</small>
                </div>
                <div className={styles.actions}>
                  <button disabled={busy || index === 0} onClick={() => void moveItem(item, -1)} aria-label="Move image earlier">↑</button>
                  <button disabled={busy || index === items.length - 1} onClick={() => void moveItem(item, 1)} aria-label="Move image later">↓</button>
                  <button className={styles.dangerButton} disabled={busy} onClick={() => void deleteItem(item)}>Delete</button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
