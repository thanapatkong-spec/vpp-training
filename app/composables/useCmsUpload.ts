// อัปโหลดรูป/ไฟล์ผ่านหน้าแอดมิน (commit ไป public/uploads) + เก็บ preview ชั่วคราวระหว่างรอเว็บ deploy
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
