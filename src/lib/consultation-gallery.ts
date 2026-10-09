import { createPublicSupabaseClient } from "@/lib/supabase";

export type ConsultationGalleryImage = {
  id: string;
  src: string;
};

type ConsultationGalleryRow = {
  id: string;
  storage_path: string;
};

export async function getConsultationGalleryImages(): Promise<ConsultationGalleryImage[]> {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("consultation_gallery_items")
    .select("id,storage_path,sort_order,created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load consultation gallery", error.message);
    return [];
  }

  const rows = (data ?? []) as ConsultationGalleryRow[];
  const images = await Promise.all(
    rows.map(async (item) => {
      const { data: signed, error: signedError } = await supabase.storage
        .from("project-media")
        .createSignedUrl(item.storage_path, 3600);

      if (signedError || !signed.signedUrl) return null;

      return {
        id: item.id,
        src: signed.signedUrl,
      } satisfies ConsultationGalleryImage;
    }),
  );

  return images.filter((image): image is ConsultationGalleryImage => image !== null);
}
