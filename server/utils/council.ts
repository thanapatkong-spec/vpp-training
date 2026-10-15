// ค่าตรวจสอบคุณสมบัติ (ชำระให้สัตวแพทยสภา) — ตั้งจำนวนเงิน/วิธีชำระที่ ตั้งค่าเว็บไซต์
export async function councilFee() {
  const n = Number.parseInt((await getSiteSettings()).councilFee, 10);
  return Number.isFinite(n) && n >= 0 ? n : 500;
}
