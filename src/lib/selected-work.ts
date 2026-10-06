import { createPublicSupabaseClient } from "@/lib/supabase";

export type SelectedWorkCard = {
  id: string;
  title: string;
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
};

type SelectedWorkRow = {
  id: string;
  before_storage_path: string | null;
  after_storage_path: string | null;
};

async function signedUrl(path: string) {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase.storage.from("project-media").createSignedUrl(path, 3600);
  return error ? null : data.signedUrl;
}

export async function getSelectedWorkCards(): Promise<SelectedWorkCard[]> {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("selected_work_items")
    .select("id,before_storage_path,after_storage_path,sort_order,created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load Selected Work", error.message);
    return [];
  }

  const complete = ((data ?? []) as SelectedWorkRow[]).filter(
    (item): item is SelectedWorkRow & { before_storage_path: string; after_storage_path: string } =>
      Boolean(item.before_storage_path && item.after_storage_path),
  );

  const cards = await Promise.all(complete.map(async (item, index) => {
    const [beforeSrc, afterSrc] = await Promise.all([
      signedUrl(item.before_storage_path),
      signedUrl(item.after_storage_path),
    ]);
    if (!beforeSrc || !afterSrc) return null;
    return {
      id: item.id,
      title: `Selected Work ${index + 1}`,
      beforeSrc,
      afterSrc,
      beforeAlt: "Before view",
      afterAlt: "After view",
    } satisfies SelectedWorkCard;
  }));

  return cards.filter((card): card is SelectedWorkCard => card !== null);
}
