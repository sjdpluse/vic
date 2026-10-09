"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import styles from "./about-image.module.css";

type Profile = {
  id: string;
  role: "admin" | "editor" | "viewer";
  display_name: string | null;
};

type AboutMedia = {
  storage_path: string;
  updated_at: string;
  url: string | null;
};

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export function AboutImageConsole() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [media, setMedia] = useState<AboutMedia | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const isStaff = profile?.role === "admin" || profile?.role === "editor";

  const loadMedia = useCallback(async () => {
    const { data, error } = await supabase
      .from("about_page_media")
      .select("storage_path,updated_at")
      .eq("id", "hero")
      .maybeSingle();

    if (error) {
      setMessage(error.message);
      return;
    }

    if (!data?.storage_path) {
      setMedia(null);
      return;
    }

    const { data: signed } = await supabase.storage
      .from("project-media")
      .createSignedUrl(data.storage_path, 3600);

    setMedia({
      storage_path: data.storage_path,
      updated_at: data.updated_at,
      url: signed?.signedUrl ?? null,
    });
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
    if (isStaff) void loadMedia();
  }, [isStaff, loadMedia]);

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
    setMedia(null);
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    if (!isStaff) return;

    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_FILE_BYTES) {
      setMessage("Use a JPG, PNG, WebP or AVIF image up to 20 MB.");
      return;
    }

    setBusy(true);
    setMessage("");

    const previousPath = media?.storage_path ?? null;
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
    const path = `about/${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("project-media")
      .upload(path, file, {
        contentType: file.type || undefined,
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      setBusy(false);
      setMessage(uploadError.message);
      return;
    }

    const { error: saveError } = await supabase
      .from("about_page_media")
      .upsert(
        {
          id: "hero",
          storage_path: path,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

    if (saveError) {
      await supabase.storage.from("project-media").remove([path]);
      setBusy(false);
      setMessage(saveError.message);
      return;
    }

    if (previousPath && previousPath !== path) {
      await supabase.storage.from("project-media").remove([previousPath]);
    }

    setBusy(false);
    setMessage("About hero image updated.");
    await loadMedia();
  }

  async function removeImage() {
    if (!isStaff || !media || !window.confirm("Remove the current About hero image?")) return;

    setBusy(true);
    setMessage("");

    const currentPath = media.storage_path;
    const { error } = await supabase
      .from("about_page_media")
      .delete()
      .eq("id", "hero");

    if (error) {
      setBusy(false);
      setMessage(error.message);
      return;
    }

    const { error: storageError } = await supabase.storage
      .from("project-media")
      .remove([currentPath]);

    setMedia(null);
    setBusy(false);
    setMessage(
      storageError
        ? `Image reference removed, but the file could not be deleted: ${storageError.message}`
        : "About hero image removed.",
    );
  }

  if (!session) {
    return (
      <main className={styles.shell}>
        <section className={styles.loginCard}>
          <p className={styles.eyebrow}>VIC PREMIER / ADMIN</p>
          <h1>About Image</h1>
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
          <p>This account is not approved for About page media management.</p>
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
          <h1>About Image</h1>
          <p className={styles.intro}>
            Manage the main image used in the About page hero. Uploading a new image replaces the current one.
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
          <span>{busy ? "Uploading…" : media ? "Replace image" : "+ Upload image"}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={busy}
            onChange={(event) => void uploadImage(event)}
          />
        </label>
      </div>

      {message ? <p className={styles.globalMessage}>{message}</p> : null}

      <section className={styles.mediaCard}>
        {media?.url ? (
          <div className={styles.preview}>
            <img src={media.url} alt="Current About page hero" />
          </div>
        ) : (
          <div className={styles.emptyPreview}>
            <span>No About image uploaded yet</span>
          </div>
        )}

        <div className={styles.cardBody}>
          <div>
            <strong>{media ? "Current About hero" : "About hero image"}</strong>
            <small>
              {media
                ? "This image is live on the About page."
                : "The page uses its fallback background until an image is uploaded."}
            </small>
          </div>
          {media ? (
            <button className={styles.dangerButton} disabled={busy} onClick={() => void removeImage()}>
              Remove
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}
