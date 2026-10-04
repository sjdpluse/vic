import { createPublicSupabaseClient, projectMediaPublicUrl } from "@/lib/supabase";

export type ProjectMedia = {
  id: string;
  storage_path: string;
  media_type: "image" | "video";
  alt_text: string | null;
  caption: string | null;
  sort_order: number;
};

export type PublishedProject = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  featured: boolean;
  sort_order: number;
  published_at: string | null;
  project_media: ProjectMedia[];
};

function normalizeProject<T extends PublishedProject>(project: T): T {
  return {
    ...project,
    project_media: [...(project.project_media ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  };
}

const publishedProjectSelect =
  "id,slug,title,summary,description,featured,sort_order,published_at,project_media(id,storage_path,media_type,alt_text,caption,sort_order)";

export async function getPublishedProjects(limit = 6): Promise<PublishedProject[]> {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select(publishedProjectSelect)
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to load published projects", error.message);
    return [];
  }

  return (data ?? []).map((project) => normalizeProject(project as PublishedProject));
}

export async function getPublishedProjectBySlug(slug: string): Promise<PublishedProject | null> {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select(publishedProjectSelect)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Failed to load published project", error.message);
    return null;
  }

  return data ? normalizeProject(data as PublishedProject) : null;
}

export function projectMediaUrl(media: ProjectMedia) {
  return projectMediaPublicUrl(media.storage_path);
}

export function projectCover(project: PublishedProject) {
  const media = project.project_media.find((item) => item.media_type === "image");
  return media
    ? {
        src: projectMediaUrl(media),
        alt: media.alt_text || project.title,
      }
    : null;
}
