import nodemailer from "nodemailer";

// ส่งอีเมลผ่าน Gmail/SMTP (ตั้ง SMTP_USER + SMTP_PASS) หรือ Resend (ตั้ง RESEND_API_KEY)
// ถ้าไม่ได้ตั้งทั้งสองแบบ จะพิมพ์ลง log แทน (ใช้ตอนพัฒนา)
const smtpEnabled = () => !!(process.env.SMTP_USER && process.env.SMTP_PASS);
export const mailerEnabled = () => smtpEnabled() || !!process.env.RESEND_API_KEY;

let transport: ReturnType<typeof nodemailer.createTransport> | null = null;
function smtp() {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT || 465);
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS!.replace(/\s+/g, "") }, // รหัสผ่านแอปของ Google มีช่องว่างคั่นได้
    });
  }
  return transport;
}

/** ส่งสำเร็จ = true (โหมดพัฒนาที่พิมพ์ลง log ถือว่าสำเร็จ) */
export async function sendMail(opts: { to: string | string[]; subject: string; html: string; text: string; replyTo?: string }): Promise<boolean> {
  const to = (Array.isArray(opts.to) ? opts.to : [opts.to]).filter((e) => e && !e.endsWith("@placeholder.invalid"));
  if (!to.length) return false;
  const replyTo = opts.replyTo || process.env.MAIL_REPLY_TO || "info@vetvpp.com"; // ผู้สมัครกดตอบกลับแล้วถึงทีมงาน
  try {
    if (smtpEnabled()) {
      // Gmail ส่งได้เฉพาะในนามบัญชีที่ล็อกอิน (หรือ alias ที่ยืนยันแล้ว)
      const from = process.env.MAIL_FROM || `VPP <${process.env.SMTP_USER}>`;
      await smtp().sendMail({ from, to, replyTo, subject: opts.subject, html: opts.html, text: opts.text });
      return true;
    }
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      console.log(`[mail:dev] to=${to.join(",")} reply-to=${replyTo} subject=${opts.subject}\n${opts.text}`);
      return true;
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM || "VPP <onboarding@resend.dev>", to, reply_to: replyTo, subject: opts.subject, html: opts.html, text: opts.text }),
    });
    if (!res.ok) console.error("[mail] send failed", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error("[mail] send error", e); // อีเมลล้มเหลวต้องไม่ทำให้งานหลักล้ม
    return false;
  }
}
