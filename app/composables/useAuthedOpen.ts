// เปิดไฟล์ที่ต้องส่ง header แอดมิน (x-admin-key) — ลิงก์ธรรมดาส่ง header ไม่ได้
export function useAuthedOpen(authHeaders: () => Record<string, string> | undefined) {
  return async (url: string) => {
    const w = window.open("", "_blank"); // เปิดแท็บก่อน กันเบราว์เซอร์บล็อกป๊อปอัป
    try {
      const blob = await $fetch<Blob>(url, { headers: authHeaders(), responseType: "blob" });
      const href = URL.createObjectURL(blob);
      if (w) w.location.href = href;
      else window.location.href = href;
      setTimeout(() => URL.revokeObjectURL(href), 60_000);
    } catch {
      w?.close();
      alert("เปิดไฟล์ไม่สำเร็จ");
    }
  };
}
