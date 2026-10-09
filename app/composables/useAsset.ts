// ต่อ baseURL (เช่น /vpp-training/ บน GitHub Pages) เข้ากับ path ของรูป/ไฟล์ใน public/
export const useAsset = () => {
  const base = useRuntimeConfig().app.baseURL.replace(/\/$/, "");
  return (path: string) => (/^https?:\/\//.test(path) ? path : base + (path.startsWith("/") ? path : `/${path}`));
};
