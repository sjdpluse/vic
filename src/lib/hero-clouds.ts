import { createPublicSupabaseClient } from "@/lib/supabase";

export type HeroCloudSlot = "left_to_right" | "right_to_left";

export type HeroCloudMedia = {
  slot: HeroCloudSlot;
  storagePath: string;
  src: string;
};

type HeroCloudRow = {
  slot: HeroCloudSlot;
  storage_path: string;
};

export async function getHeroCloudMedia(): Promise<HeroCloudMedia[]> {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("hero_cloud_media")
    .select("slot,storage_path");

  if (error) {
    console.error("Failed to load hero cloud media", error.message);
    return [];
  }

  const rows = (data ?? []) as HeroCloudRow[];
  const clouds = await Promise.all(
    rows.map(async (item) => {
      const { data: signed, error: signedError } = await supabase.storage
        .from("project-media")
        .createSignedUrl(item.storage_path, 3600);

      if (signedError || !signed?.signedUrl) return null;

      return {
        slot: item.slot,
        storagePath: item.storage_path,
        src: signed.signedUrl,
      } satisfies HeroCloudMedia;
    }),
  );

  return clouds.filter((cloud): cloud is HeroCloudMedia => cloud !== null);
}
