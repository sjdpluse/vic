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

export async function getPublishedProjects(limit = 6): Promise<PublishedProject[]> {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id,slug,title,summary,description,featured,sort_order,published_at,project_media(id,storage_path,media_type,alt_text,caption,sort_order)",
    )
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to load published projects", error.message);
    return [];
  }

  return (data ?? []).map((project) => ({
    ...project,
    project_media: [...(project.project_media ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    ),
  })) as PublishedProject[];
}

export function projectCover(project: PublishedProject) {
  const media = project.project_media.find((item) => item.media_type === "image");
  return media
    ? {
        src: projectMediaPublicUrl(media.storage_path),
        alt: media.alt_text || project.title,
      }
    : null;
}
