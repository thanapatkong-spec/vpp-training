// เนื้อหาเว็บจากฐานข้อมูล (สด) — รายการ และรายการเดียว (ไม่พบ = หน้า 404)
export type ContentRow = { slug: string; [k: string]: any };

export async function useContentList(collection: string) {
  const { data } = await useFetch<ContentRow[]>(`/api/content/${collection}`, { key: `content-${collection}`, default: () => [] });
  return computed(() => data.value ?? []);
}

export async function useContentItem(collection: string, slug: string, notFound = "ไม่พบเนื้อหา") {
  const { data, error } = await useFetch<ContentRow & { html?: string }>(`/api/content/${collection}/${encodeURIComponent(slug)}`, { key: `content-${collection}-${slug}` });
  if (error.value || !data.value) throw createError({ statusCode: 404, statusMessage: notFound, fatal: true });
  return data as Ref<ContentRow & { html?: string }>;
}
