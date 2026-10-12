import { mergeSettings, type SiteSettings } from "#shared/siteSettings";

/** ตั้งค่าเว็บไซต์ที่บันทึกในฐานข้อมูล รวมกับค่าเริ่มต้น */
export async function getSiteSettings(): Promise<SiteSettings> {
  if (!useDb()) return mergeSettings(null);
  const it = await getItem("settings", "site");
  return mergeSettings(it?.data as never);
}
