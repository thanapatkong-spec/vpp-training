// ต่อ baseURL เข้ากับ path ของรูป/ไฟล์ (ไฟล์ใน public/ หรือ /api/media/...) · URL เต็ม (Vercel Blob) ใช้ตามเดิม
export const useAsset = () => {
  const base = useRuntimeConfig().app.baseURL.replace(/\/$/, "");
  return (path: string) => {
    if (/^https?:\/\//.test(path)) return path;
    const p = path.startsWith("/") ? path : `/${path}`;
    return base + (p.includes("%") ? p : encodeURI(p)); // รองรับชื่อไฟล์ไทย/เว้นวรรค
  };
};
