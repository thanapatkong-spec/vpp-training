// ตรวจสลิปโอนเงินอัตโนมัติผ่าน SlipOK (https://slipok.com)
// ตั้ง env: SLIPOK_BRANCH_ID, SLIPOK_API_KEY  ถ้าไม่ตั้ง = แอดมินตรวจสลิปเอง
export type SlipResult =
  | { configured: false }
  | { configured: true; ok: true; transRef: string; amount: number }
  | { configured: true; ok: false; reason: string };

export const slipCheckEnabled = () => !!(process.env.SLIPOK_BRANCH_ID && process.env.SLIPOK_API_KEY);

export async function verifySlip(data: Buffer, contentType: string, expectedAmount: number): Promise<SlipResult> {
  if (!slipCheckEnabled()) return { configured: false };
  const base = (process.env.SLIPOK_API_URL || "https://api.slipok.com").replace(/\/$/, "");
  const fd = new FormData();
  fd.append("files", new Blob([data], { type: contentType }), contentType === "image/png" ? "slip.png" : "slip.jpg");
  fd.append("log", "true"); // ให้ SlipOK จำสลิปไว้ กันใช้สลิปซ้ำ
  fd.append("amount", String(expectedAmount));
  try {
    const res = await fetch(`${base}/api/line/apikey/${process.env.SLIPOK_BRANCH_ID}`, { method: "POST", headers: { "x-authorization": process.env.SLIPOK_API_KEY! }, body: fd });
    const j: any = await res.json().catch(() => ({}));
    const d = j?.data;
    if (res.ok && j?.success && d?.success && d?.transRef) {
      const amount = Number(d.amount);
      if (amount !== expectedAmount) return { configured: true, ok: false, reason: `ยอดเงินในสลิป (${amount} บาท) ไม่ตรงกับยอดที่ต้องชำระ (${expectedAmount} บาท)` };
      return { configured: true, ok: true, transRef: String(d.transRef), amount };
    }
    return { configured: true, ok: false, reason: j?.message ? `ตรวจสลิปไม่ผ่าน: ${j.message}` : "ตรวจสลิปไม่ผ่าน กรุณาตรวจว่าเป็นสลิปที่ถูกต้องและชัดเจน" };
  } catch {
    return { configured: true, ok: false, reason: "ระบบตรวจสลิปไม่ตอบสนอง กรุณาลองใหม่ หรือรอทีมงานตรวจสอบ" };
  }
}
