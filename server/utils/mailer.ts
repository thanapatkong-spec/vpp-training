// ส่งอีเมลผ่าน Resend (REST) ถ้าไม่ได้ตั้ง RESEND_API_KEY จะพิมพ์ลง log แทน (ใช้ตอนพัฒนา)
export const mailerEnabled = () => !!process.env.RESEND_API_KEY;

export async function sendMail(opts: { to: string | string[]; subject: string; html: string; text: string; replyTo?: string }) {
  const to = (Array.isArray(opts.to) ? opts.to : [opts.to]).filter((e) => e && !e.endsWith("@placeholder.invalid"));
  if (!to.length) return;
  const replyTo = opts.replyTo || process.env.MAIL_REPLY_TO || "info@vetvpp.com"; // ผู้สมัครกดตอบกลับแล้วถึงทีมงาน
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[mail:dev] to=${to.join(",")} reply-to=${replyTo} subject=${opts.subject}\n${opts.text}`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM || "VPP <onboarding@resend.dev>", to, reply_to: replyTo, subject: opts.subject, html: opts.html, text: opts.text }),
    });
    if (!res.ok) console.error("[mail] send failed", res.status, await res.text());
  } catch (e) {
    console.error("[mail] send error", e); // อีเมลล้มเหลวต้องไม่ทำให้งานหลักล้ม
  }
}
