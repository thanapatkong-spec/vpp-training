// ต่อ baseURL (เช่น /vpp-training/ บน GitHub Pages) เข้ากับ path ของรูป/ไฟล์ใน public/
export const useAsset = () => {
  const base = useRuntimeConfig().app.baseURL.replace(/\/$/, "");
  return (path: string) => {
    if (/^https?:\/\//.test(path)) return path;
    const p = path.startsWith("/") ? path : `/${path}`;
    return base + (p.includes("%") ? p : encodeURI(p)); // รองรับชื่อไฟล์ไทย/เว้นวรรค
  };
};
