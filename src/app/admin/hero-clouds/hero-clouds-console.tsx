"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import type { HeroCloudSlot } from "@/lib/hero-clouds";
import styles from "./hero-clouds.module.css";

type Profile = {
  id: string;
  role: "admin" | "editor" | "viewer";
  display_name: string | null;
};

type CloudItem = {
  slot: HeroCloudSlot;
  storage_path: string;
  updated_at: string;
  url: string | null;
};

const MAX_FILE_BYTES = 15 * 1024 * 1024;

const slots: Array<{
  slot: HeroCloudSlot;
  title: string;
  direction: string;
  description: string;
}> = [
  {
    slot: "left_to_right",
    title: "Cloud 01",
    direction: "Left → Right",
    description: "Moves softly above the house and behind the hero copy.",
  },
  {
    slot: "right_to_left",
    title: "Cloud 02",
    direction: "Right → Left",
    description: "Crosses the hero title area to create foreground depth.",
  },
];

export function HeroCloudsConsole() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clouds, setClouds] = useState<CloudItem[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busySlot, setBusySlot] = useState<HeroCloudSlot | "auth" | null>(null);

  const isStaff = profile?.role === "admin" || profile?.role === "editor";

  const loadClouds = useCallback(async () => {
    const { data, error } = await supabase
      .from("hero_cloud_media")
      .select("slot,storage_path,updated_at");

    if (error) {
      setMessage(error.message);
      return;
    }

    const rows = (data ?? []) as Omit<CloudItem, "url">[];
    const resolved = await Promise.all(
      rows.map(async (item) => {
        const { data: signed } = await supabase.storage
          .from("project-media")
          .createSignedUrl(item.storage_path, 3600);

        return { ...item, url: signed?.signedUrl ?? null };
      }),
    );

    setClouds(resolved);
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
    if (isStaff) void loadClouds();
  }, [isStaff, loadClouds]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusySlot("auth");
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusySlot(null);
    if (error) setMessage(error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setClouds([]);
  }

  async function uploadCloud(slot: HeroCloudSlot, event: ChangeEvent<HTMLInputElement>) {
    if (!isStaff) return;

    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.type !== "image/png" || file.size > MAX_FILE_BYTES) {
      setMessage("Upload a transparent PNG image up to 15 MB.");
      return;
    }

    setBusySlot(slot);
    setMessage("");

    const existing = clouds.find((cloud) => cloud.slot === slot);
    const previousPath = existing?.storage_path ?? null;
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
    const path = `hero-clouds/${slot}/${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("project-media")
      .upload(path, file, {
        contentType: "image/png",
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      setBusySlot(null);
      setMessage(uploadError.message);
      return;
    }

    const { error: saveError } = await supabase
      .from("hero_cloud_media")
      .upsert(
        {
          slot,
          storage_path: path,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "slot" },
      );

    if (saveError) {
      await supabase.storage.from("project-media").remove([path]);
      setBusySlot(null);
      setMessage(saveError.message);
      return;
    }

    if (previousPath && previousPath !== path) {
      await supabase.storage.from("project-media").remove([previousPath]);
    }

    setBusySlot(null);
    setMessage(`${slot === "left_to_right" ? "Cloud 01" : "Cloud 02"} updated.`);
    await loadClouds();
  }

  async function removeCloud(slot: HeroCloudSlot) {
    if (!isStaff) return;
    const existing = clouds.find((cloud) => cloud.slot === slot);
    if (!existing || !window.confirm("Remove this cloud from the landing hero?")) return;

    setBusySlot(slot);
    setMessage("");

    const { error: deleteError } = await supabase
      .from("hero_cloud_media")
      .delete()
      .eq("slot", slot);

    if (deleteError) {
      setBusySlot(null);
      setMessage(deleteError.message);
      return;
    }

    const { error: storageError } = await supabase.storage
      .from("project-media")
      .remove([existing.storage_path]);

    setBusySlot(null);
    setMessage(
      storageError
        ? `Cloud removed from the hero, but its file could not be deleted: ${storageError.message}`
        : "Cloud removed.",
    );
    await loadClouds();
  }

  if (!session) {
    return (
      <main className={styles.shell}>
        <section className={styles.loginCard}>
          <p className={styles.eyebrow}>VIC PREMIER / ADMIN</p>
          <h1>Hero Clouds</h1>
          <p>Sign in with an approved VIC staff account.</p>
          <form className={styles.form} onSubmit={handleLogin}>
            <label>Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
            <button disabled={busySlot === "auth"}>{busySlot === "auth" ? "Signing in…" : "Sign in"}</button>
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
          <p>This account is not approved for hero media management.</p>
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
          <h1>Hero Clouds</h1>
          <p className={styles.intro}>
            Upload transparent PNG clouds for the landing hero. Each slot has its own position, depth and travel direction.
          </p>
        </div>
        <div className={styles.account}>
          <span>{profile.display_name || session.user.email}</span>
          <small>{profile.role}</small>
          <button className={styles.secondaryButton} onClick={signOut}>Sign out</button>
        </div>
      </header>

      {message ? <p className={styles.globalMessage}>{message}</p> : null}

      <section className={styles.grid} aria-label="Hero cloud slots">
        {slots.map((definition) => {
          const cloud = clouds.find((item) => item.slot === definition.slot);
          const busy = busySlot === definition.slot;

          return (
            <article className={styles.card} key={definition.slot}>
              <div className={styles.preview}>
                {cloud?.url ? (
                  <img src={cloud.url} alt="" />
                ) : (
                  <span>No PNG uploaded</span>
                )}
                <b>{definition.direction}</b>
              </div>

              <div className={styles.cardBody}>
                <div>
                  <strong>{definition.title}</strong>
                  <small>{definition.description}</small>
                </div>

                <div className={styles.actions}>
                  <label className={styles.uploadButton}>
                    <span>{busy ? "Uploading…" : cloud ? "Replace PNG" : "+ Upload PNG"}</span>
                    <input
                      type="file"
                      accept="image/png"
                      disabled={busySlot !== null}
                      onChange={(event) => void uploadCloud(definition.slot, event)}
                    />
                  </label>
                  {cloud ? (
                    <button
                      className={styles.dangerButton}
                      disabled={busySlot !== null}
                      onClick={() => void removeCloud(definition.slot)}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
