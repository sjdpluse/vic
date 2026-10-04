"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createBrowserSupabaseClient, projectMediaPublicUrl } from "@/lib/supabase";
import styles from "./admin.module.css";

type Profile = {
  id: string;
  role: "admin" | "editor" | "viewer";
  display_name: string | null;
};

type ProjectMedia = {
  id: string;
  project_id: string;
  storage_path: string;
  media_type: "image" | "video";
  alt_text: string | null;
  caption: string | null;
  sort_order: number;
  created_at: string;
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
  project_media: ProjectMedia[];
};

type EditProject = Pick<Project, "title" | "slug" | "summary" | "description" | "sort_order">;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sortMedia(items: ProjectMedia[]) {
  return [...items].sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));
}

export function AdminConsole() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editing, setEditing] = useState<Record<string, EditProject>>({});
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
      .select("id,slug,title,summary,description,status,featured,sort_order,published_at,created_at,project_media(id,project_id,storage_path,media_type,alt_text,caption,sort_order,created_at)")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    const next = (data ?? []).map((project) => ({
      ...project,
      project_media: sortMedia(project.project_media ?? []),
    })) as Project[];
    setProjects(next);
    setEditing(Object.fromEntries(next.map((project) => [project.id, {
      title: project.title,
      slug: project.slug,
      summary: project.summary,
      description: project.description,
      sort_order: project.sort_order,
    }])));
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

    const { count } = await supabase.from("projects").select("id", { count: "exact", head: true }).eq("slug", slug);
    if (count) {
      setMessage("That project slug is already in use. Change the title or edit the slug after creating another draft.");
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

  function updateDraft(projectId: string, field: keyof EditProject, value: string | number) {
    setEditing((current) => ({
      ...current,
      [projectId]: {
        ...current[projectId],
        [field]: value,
      },
    }));
  }

  async function saveProject(project: Project) {
    if (!isStaff) return;
    const draft = editing[project.id];
    if (!draft) return;
    const cleanSlug = slugify(draft.slug);
    if (!draft.title.trim() || !cleanSlug) {
      setMessage("Project title and slug are required.");
      return;
    }

    const { count } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("slug", cleanSlug)
      .neq("id", project.id);
    if (count) {
      setMessage("That project slug is already in use.");
      return;
    }

    setBusy(true);
    setMessage("");
    const { error } = await supabase.from("projects").update({
      title: draft.title.trim(),
      slug: cleanSlug,
      summary: draft.summary?.trim() || null,
      description: draft.description?.trim() || null,
      sort_order: Number(draft.sort_order) || 0,
    }).eq("id", project.id);
    setBusy(false);

    if (error) setMessage(error.message);
    else {
      setMessage("Project details saved.");
      await loadProjects();
    }
  }

  async function setStatus(project: Project, status: Project["status"]) {
    if (!isStaff) return;
    if (status === "published" && project.project_media.length === 0) {
      setMessage("Upload at least one project image or video before publishing.");
      return;
    }

    setBusy(true);
    setMessage("");
    const { error } = await supabase
      .from("projects")
      .update({
        status,
        published_at: status === "published" ? project.published_at || new Date().toISOString() : project.published_at,
      })
      .eq("id", project.id);
    setBusy(false);
    if (error) setMessage(error.message);
    else await loadProjects();
  }

  async function toggleFeatured(project: Project) {
    if (!isStaff) return;
    setBusy(true);
    const { error } = await supabase.from("projects").update({ featured: !project.featured }).eq("id", project.id);
    setBusy(false);
    if (error) setMessage(error.message);
    else await loadProjects();
  }

  async function uploadMedia(project: Project, file: File) {
    if (!isStaff) return;
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
    const path = `${project.id}/${crypto.randomUUID()}-${safeName}`;
    const nextSortOrder = project.project_media.length
      ? Math.max(...project.project_media.map((item) => item.sort_order)) + 10
      : 0;

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
      project_id: project.id,
      storage_path: path,
      media_type: mediaType,
      alt_text: mediaType === "image" ? file.name.replace(/\.[^.]+$/, "") : null,
      sort_order: nextSortOrder,
    });

    if (insertError) {
      await supabase.storage.from("project-media").remove([path]);
      setBusy(false);
      setMessage(`Media record failed and the uploaded file was rolled back: ${insertError.message}`);
      return;
    }

    setBusy(false);
    setMessage("Project media uploaded.");
    await loadProjects();
  }

  async function deleteMedia(media: ProjectMedia) {
    if (!isStaff) return;
    if (!window.confirm("Delete this media file from the project?")) return;
    setBusy(true);
    setMessage("");

    const { error: storageError } = await supabase.storage.from("project-media").remove([media.storage_path]);
    if (storageError) {
      setBusy(false);
      setMessage(storageError.message);
      return;
    }

    const { error: rowError } = await supabase.from("project_media").delete().eq("id", media.id);
    setBusy(false);
    if (rowError) setMessage(rowError.message);
    else {
      setMessage("Project media deleted.");
      await loadProjects();
    }
  }

  async function setCover(project: Project, media: ProjectMedia) {
    if (!isStaff) return;
    const ordered = sortMedia(project.project_media.filter((item) => item.id !== media.id));
    setBusy(true);
    setMessage("");

    const { error: coverError } = await supabase.from("project_media").update({ sort_order: 0 }).eq("id", media.id);
    if (coverError) {
      setBusy(false);
      setMessage(coverError.message);
      return;
    }

    for (let index = 0; index < ordered.length; index += 1) {
      const { error } = await supabase.from("project_media").update({ sort_order: (index + 1) * 10 }).eq("id", ordered[index].id);
      if (error) {
        setBusy(false);
        setMessage(error.message);
        return;
      }
    }

    setBusy(false);
    setMessage("Cover media updated.");
    await loadProjects();
  }

  async function moveMedia(project: Project, media: ProjectMedia, direction: -1 | 1) {
    if (!isStaff) return;
    const ordered = sortMedia(project.project_media);
    const index = ordered.findIndex((item) => item.id === media.id);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= ordered.length) return;

    const a = ordered[index];
    const b = ordered[swapIndex];
    setBusy(true);
    setMessage("");
    const { error: firstError } = await supabase.from("project_media").update({ sort_order: b.sort_order }).eq("id", a.id);
    if (firstError) {
      setBusy(false);
      setMessage(firstError.message);
      return;
    }
    const { error: secondError } = await supabase.from("project_media").update({ sort_order: a.sort_order }).eq("id", b.id);
    setBusy(false);
    if (secondError) setMessage(secondError.message);
    else await loadProjects();
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
            <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
            <button disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
          </form>
          {message ? <p className={styles.message}>{message}</p> : null}
        </section>
      </main>
    );
  }

  if (!profile) return <main className={styles.shell}><section className={styles.card}>Loading account…</section></main>;

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
        <div><p className={styles.eyebrow}>VIC PREMIER / CMS</p><h1>Projects</h1></div>
        <div className={styles.account}>
          <span>{profile.display_name || session.user.email}</span>
          <small>{profile.role}</small>
          <button className={styles.secondaryButton} onClick={signOut}>Sign out</button>
        </div>
      </header>

      {message ? <p className={styles.globalMessage}>{message}</p> : null}

      <section className={styles.grid}>
        <form className={styles.card} onSubmit={handleCreate}>
          <p className={styles.eyebrow}>NEW PROJECT</p>
          <h2>Create draft</h2>
          <div className={styles.form}>
            <label>Project title<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
            <label>Summary<textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={3} /></label>
            <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={6} /></label>
            <button disabled={busy}>{busy ? "Working…" : "Create draft"}</button>
          </div>
        </form>

        <section className={styles.list} aria-label="Projects">
          {projects.length === 0 ? (
            <article className={styles.card}><h2>No projects yet</h2><p>Create the first verified project as a draft. Nothing appears publicly until it is published.</p></article>
          ) : projects.map((project) => {
            const draft = editing[project.id] ?? project;
            const media = sortMedia(project.project_media);
            return (
              <article className={styles.projectCard} key={project.id}>
                <div className={styles.projectHeading}>
                  <div>
                    <span className={styles.status}>{project.status}{project.featured ? " · featured" : ""}</span>
                    <h2>{project.title}</h2>
                    <p>{project.summary || "No summary yet."}</p>
                  </div>
                  <a className={styles.slug} href={`/projects/${project.slug}`} target="_blank" rel="noreferrer">/{project.slug} ↗</a>
                </div>

                <div className={styles.editGrid}>
                  <label>Title<input value={draft.title} onChange={(event) => updateDraft(project.id, "title", event.target.value)} /></label>
                  <label>Slug<input value={draft.slug} onChange={(event) => updateDraft(project.id, "slug", event.target.value)} /></label>
                  <label className={styles.fullWidth}>Summary<textarea rows={2} value={draft.summary ?? ""} onChange={(event) => updateDraft(project.id, "summary", event.target.value)} /></label>
                  <label className={styles.fullWidth}>Description<textarea rows={5} value={draft.description ?? ""} onChange={(event) => updateDraft(project.id, "description", event.target.value)} /></label>
                  <label>Sort order<input type="number" value={draft.sort_order} onChange={(event) => updateDraft(project.id, "sort_order", Number(event.target.value))} /></label>
                  <button disabled={busy} onClick={() => saveProject(project)}>Save details</button>
                </div>

                <div className={styles.actions}>
                  {project.status !== "published" ? (
                    <button disabled={busy} onClick={() => setStatus(project, "published")}>Publish</button>
                  ) : (
                    <button disabled={busy} onClick={() => setStatus(project, "draft")}>Unpublish</button>
                  )}
                  <button className={styles.secondaryButton} disabled={busy} onClick={() => toggleFeatured(project)}>{project.featured ? "Unfeature" : "Feature"}</button>
                  <button className={styles.secondaryButton} disabled={busy} onClick={() => setStatus(project, "archived")}>Archive</button>
                </div>

                <label className={styles.upload}>
                  <span>Upload project photo or MP4</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4" disabled={busy} onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadMedia(project, file);
                    event.currentTarget.value = "";
                  }} />
                </label>

                {media.length > 0 ? (
                  <div className={styles.mediaGrid}>
                    {media.map((item, index) => (
                      <article className={styles.mediaCard} key={item.id}>
                        <div className={styles.mediaPreview}>
                          {item.media_type === "image" ? (
                            <img src={projectMediaPublicUrl(item.storage_path)} alt={item.alt_text || project.title} />
                          ) : (
                            <video src={projectMediaPublicUrl(item.storage_path)} muted controls preload="metadata" />
                          )}
                          {index === 0 ? <span className={styles.coverBadge}>Cover</span> : null}
                        </div>
                        <div className={styles.mediaActions}>
                          {index !== 0 ? <button disabled={busy} onClick={() => setCover(project, item)}>Set cover</button> : null}
                          <button disabled={busy || index === 0} onClick={() => moveMedia(project, item, -1)}>↑</button>
                          <button disabled={busy || index === media.length - 1} onClick={() => moveMedia(project, item, 1)}>↓</button>
                          <button className={styles.dangerButton} disabled={busy} onClick={() => deleteMedia(item)}>Delete</button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : <p className={styles.emptyMedia}>No media yet. A project cannot be published until at least one file is uploaded.</p>}
              </article>
            );
          })}
        </section>
      </section>
    </main>
  );
}
