"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import styles from "./admin.module.css";

type Profile = {
  id: string;
  role: "admin" | "editor" | "viewer";
  display_name: string | null;
};

type Project = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  status: "draft" | "published" | "archived";
  featured: boolean;
  sort_order: number;
  published_at: string | null;
  created_at: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function AdminConsole() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const isStaff = profile?.role === "admin" || profile?.role === "editor";

  const loadProjects = useCallback(async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("id,slug,title,summary,description,status,featured,sort_order,published_at,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setProjects((data ?? []) as Project[]);
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
    if (isStaff) void loadProjects();
  }, [isStaff, loadProjects]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setMessage(error.message);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isStaff) return;

    const slug = slugify(title);
    if (!slug) {
      setMessage("Add a project title first.");
      return;
    }

    setBusy(true);
    setMessage("");
    const { error } = await supabase.from("projects").insert({
      title: title.trim(),
      slug,
      summary: summary.trim() || null,
      description: description.trim() || null,
      status: "draft",
    });
    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setTitle("");
    setSummary("");
    setDescription("");
    setMessage("Draft project created.");
    await loadProjects();
  }

  async function setStatus(project: Project, status: Project["status"]) {
    if (!isStaff) return;
    setBusy(true);
    setMessage("");

    const { error } = await supabase
      .from("projects")
      .update({
        status,
        published_at:
          status === "published" ? project.published_at || new Date().toISOString() : project.published_at,
      })
      .eq("id", project.id);

    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }

    await loadProjects();
  }

  async function toggleFeatured(project: Project) {
    if (!isStaff) return;
    setBusy(true);
    const { error } = await supabase
      .from("projects")
      .update({ featured: !project.featured })
      .eq("id", project.id);
    setBusy(false);
    if (error) setMessage(error.message);
    else await loadProjects();
  }

  async function uploadMedia(projectId: string, file: File) {
    if (!isStaff) return;
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
    const path = `${projectId}/${crypto.randomUUID()}-${safeName}`;

    setBusy(true);
    setMessage("");
    const { error: uploadError } = await supabase.storage
      .from("project-media")
      .upload(path, file, { contentType: file.type || undefined, upsert: false });

    if (uploadError) {
      setBusy(false);
      setMessage(uploadError.message);
      return;
    }

    const mediaType = file.type.startsWith("video/") ? "video" : "image";
    const { error: insertError } = await supabase.from("project_media").insert({
      project_id: projectId,
      storage_path: path,
      media_type: mediaType,
      alt_text: mediaType === "image" ? file.name.replace(/\.[^.]+$/, "") : null,
      sort_order: 0,
    });
    setBusy(false);

    if (insertError) {
      setMessage(insertError.message);
      return;
    }

    setMessage("Project media uploaded.");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProjects([]);
  }

  if (!session) {
    return (
      <main className={styles.shell}>
        <section className={styles.card}>
          <p className={styles.eyebrow}>VIC PREMIER / ADMIN</p>
          <h1>Project CMS</h1>
          <p>Sign in with an approved VIC staff account.</p>
          <form className={styles.form} onSubmit={handleLogin}>
            <label>
              Email
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label>
              Password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
            <button disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
          </form>
          {message ? <p className={styles.message}>{message}</p> : null}
        </section>
      </main>
    );
  }

  if (!profile) {
    return <main className={styles.shell}><section className={styles.card}>Loading account…</section></main>;
  }

  if (!isStaff) {
    return (
      <main className={styles.shell}>
        <section className={styles.card}>
          <p className={styles.eyebrow}>SIGNED IN</p>
          <h1>Access pending</h1>
          <p>This account exists but has not been approved as VIC CMS staff.</p>
          <button className={styles.secondaryButton} onClick={signOut}>Sign out</button>
          {message ? <p className={styles.message}>{message}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>VIC PREMIER / CMS</p>
          <h1>Projects</h1>
        </div>
        <div className={styles.account}>
          <span>{profile.display_name || session.user.email}</span>
          <small>{profile.role}</small>
          <button className={styles.secondaryButton} onClick={signOut}>Sign out</button>
        </div>
      </header>

      <section className={styles.grid}>
        <form className={styles.card} onSubmit={handleCreate}>
          <p className={styles.eyebrow}>NEW PROJECT</p>
          <h2>Create draft</h2>
          <div className={styles.form}>
            <label>
              Project title
              <input value={title} onChange={(event) => setTitle(event.target.value)} required />
            </label>
            <label>
              Summary
              <textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={3} />
            </label>
            <label>
              Description
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={6} />
            </label>
            <button disabled={busy}>{busy ? "Working…" : "Create draft"}</button>
          </div>
          {message ? <p className={styles.message}>{message}</p> : null}
        </form>

        <section className={styles.list} aria-label="Projects">
          {projects.length === 0 ? (
            <article className={styles.card}>
              <h2>No projects yet</h2>
              <p>Create the first verified project as a draft. Nothing appears publicly until it is published.</p>
            </article>
          ) : (
            projects.map((project) => (
              <article className={styles.projectCard} key={project.id}>
                <div className={styles.projectHeading}>
                  <div>
                    <span className={styles.status}>{project.status}</span>
                    <h2>{project.title}</h2>
                    <p>{project.summary || "No summary yet."}</p>
                  </div>
                  <span className={styles.slug}>/{project.slug}</span>
                </div>

                <div className={styles.actions}>
                  {project.status !== "published" ? (
                    <button disabled={busy} onClick={() => setStatus(project, "published")}>Publish</button>
                  ) : (
                    <button disabled={busy} onClick={() => setStatus(project, "draft")}>Unpublish</button>
                  )}
                  <button className={styles.secondaryButton} disabled={busy} onClick={() => toggleFeatured(project)}>
                    {project.featured ? "Unfeature" : "Feature"}
                  </button>
                  <button className={styles.secondaryButton} disabled={busy} onClick={() => setStatus(project, "archived")}>Archive</button>
                </div>

                <label className={styles.upload}>
                  <span>Upload project photo or MP4</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif,video/mp4"
                    disabled={busy}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadMedia(project.id, file);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </article>
            ))
          )}
        </section>
      </section>
    </main>
  );
}
