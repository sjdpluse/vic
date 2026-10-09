import { createPublicSupabaseClient } from "@/lib/supabase";

export type AboutHeroMedia = {
  storagePath: string;
  src: string;
};

export async function getAboutHeroMedia(): Promise<AboutHeroMedia | null> {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("about_page_media")
    .select("storage_path")
    .eq("id", "hero")
    .maybeSingle();

  if (error) {
    console.error("Failed to load About hero media", error.message);
    return null;
  }

  if (!data?.storage_path) return null;

  const { data: signed, error: signedError } = await supabase.storage
    .from("project-media")
    .createSignedUrl(data.storage_path, 3600);

  if (signedError || !signed?.signedUrl) {
    console.error("Failed to sign About hero media", signedError?.message);
    return null;
  }

  return {
    storagePath: data.storage_path,
    src: signed.signedUrl,
  };
}
