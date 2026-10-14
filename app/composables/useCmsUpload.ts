// อัปโหลดรูป/ไฟล์ผ่านหน้าแอดมิน (ใช้ได้ทันที) + เก็บ preview ระหว่างแก้ไข
// รูปใหญ่ (เช่น ถ่ายจากมือถือ/กล้อง) ย่อให้อัตโนมัติก่อนส่ง — เลือกรูปขนาดเท่าไรก็ได้
const BIG = 1.5 * 1024 * 1024;
const isImage = (f: File) => /^image\//i.test(f.type) || /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(f.name);

export function useCmsUpload(authHeaders: () => Record<string, string> | undefined) {
  const previews = useState<Record<string, string>>("cms-previews", () => ({}));
  async function upload(picked: File): Promise<string> {
    const heic = /heic|heif/i.test(picked.type) || /\.(heic|heif)$/i.test(picked.name);
    const file = isImage(picked) && (picked.size > BIG || heic) ? await shrinkImage(picked).catch(() => picked) : picked;
    if (isImage(file) && /\.(heic|heif)$/i.test(file.name)) throw { data: { message: "เบราว์เซอร์นี้เปิดรูป HEIC ไม่ได้ กรุณาเลือกรูป JPG/PNG (หรือใช้ Safari)" } };
    if (!isImage(file) && file.size > 3 * 1024 * 1024) throw { data: { message: `ไฟล์ ${file.name} ใหญ่เกิน 3MB — ไฟล์เอกสารระบบย่อให้ไม่ได้ กรุณาลดขนาดก่อน หรือใส่เป็นลิงก์ Google Drive แทน` } };
    const fd = new FormData();
    fd.append("file", file);
    const r = await $fetch<{ path: string }>("/api/manage/cms/upload", { method: "POST", body: fd, headers: authHeaders() });
    if (isImage(file)) previews.value = { ...previews.value, [r.path]: URL.createObjectURL(file) };
    return r.path;
  }
  return { upload, previews };
}
