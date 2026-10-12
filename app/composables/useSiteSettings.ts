import { SITE_DEFAULTS, type SiteSettings } from "#shared/siteSettings";

// ตั้งค่าเว็บไซต์ (แก้ในหน้าแอดมิน) — ใช้ key เดียวกัน ข้อมูลจึงดึงครั้งเดียวต่อหน้า
const fetchSettings = () => useFetch<SiteSettings>("/api/settings", { key: "site-settings", default: () => SITE_DEFAULTS });

/** ใช้ใน <script setup> ของหน้า (รอข้อมูลก่อนเรนเดอร์ ไม่กระพริบ) */
export async function useSiteSettings() {
  const { data } = await fetchSettings();
  return computed(() => data.value ?? SITE_DEFAULTS);
}

/** ใช้ในคอมโพเนนต์ย่อย (เช่น ท้ายเว็บ) — ระหว่างโหลดใช้ค่าเริ่มต้น */
export function useSiteSettingsNow() {
  const { data } = fetchSettings();
  return computed(() => data.value ?? SITE_DEFAULTS);
}
