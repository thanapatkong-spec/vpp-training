// อัปโหลดรูป/ไฟล์ผ่านหน้าแอดมิน (ใช้ได้ทันที) + เก็บ preview ระหว่างแก้ไข
export function useCmsUpload(authHeaders: () => Record<string, string> | undefined) {
  const previews = useState<Record<string, string>>("cms-previews", () => ({}));
  async function upload(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const r = await $fetch<{ path: string }>("/api/manage/cms/upload", { method: "POST", body: fd, headers: authHeaders() });
    if (file.type.startsWith("image/")) previews.value = { ...previews.value, [r.path]: URL.createObjectURL(file) };
    return r.path;
  }
  return { upload, previews };
}
