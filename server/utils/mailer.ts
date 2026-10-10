// ส่งอีเมลผ่าน Resend (REST) ถ้าไม่ได้ตั้ง RESEND_API_KEY จะพิมพ์ลิงก์ลง log แทน (ใช้ตอนพัฒนา)
export const mailerEnabled = () => !!process.env.RESEND_API_KEY;

export async function sendMail(opts: { to: string; subject: string; html: string; text: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[mail:dev] to=${opts.to} subject=${opts.subject}\n${opts.text}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || "VPP <onboarding@resend.dev>",
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }),
  });
  if (!res.ok) console.error("[mail] send failed", res.status, await res.text());
}
