import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { timingSafeEqual } from "node:crypto";
import type { H3Event } from "h3";
import { account, session, user, verification } from "../db/schema";
import { useDb } from "./db";
import { mailerEnabled, sendMail } from "./mailer";

let _auth: ReturnType<typeof create> | null = null;

function create(db: NonNullable<ReturnType<typeof useDb>>) {
  const verifyEmail = mailerEnabled(); // มีบริการอีเมลแล้วเท่านั้นถึงบังคับยืนยันอีเมล
  const googleId = process.env.GOOGLE_CLIENT_ID;
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET;

  const mailBody = (title: string, url: string, button: string) => ({
    html: `<p>${title}</p><p><a href="${url}">${button}</a></p><p>หากไม่ได้เป็นผู้ดำเนินการ ไม่ต้องสนใจอีเมลนี้</p>`,
    text: `${title}\n${url}\nหากไม่ได้เป็นผู้ดำเนินการ ไม่ต้องสนใจอีเมลนี้`,
  });

  return betterAuth({
    database: drizzleAdapter(db, { provider: "pg", schema: { user, session, account, verification } }),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      requireEmailVerification: verifyEmail,
      sendResetPassword: async ({ user: u, url }) => {
        await sendMail({ to: u.email, subject: "ตั้งรหัสผ่านใหม่ · VPP", ...mailBody("กดลิงก์เพื่อตั้งรหัสผ่านใหม่", url, "ตั้งรหัสผ่านใหม่") });
      },
    },
    emailVerification: {
      sendOnSignUp: verifyEmail,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user: u, url }) => {
        await sendMail({ to: u.email, subject: "ยืนยันอีเมล · VPP", ...mailBody("ยืนยันอีเมลเพื่อเริ่มใช้งานบัญชี VPP", url, "ยืนยันอีเมล") });
      },
    },
    // สมาชิกที่แอดมินนำเข้าไว้ล่วงหน้า (ยังไม่มีรหัสผ่าน) เข้าด้วย Google อีเมลเดียวกันได้ทันที
    account: { accountLinking: { enabled: true, trustedProviders: ["google"] } },
    socialProviders: googleId && googleSecret ? { google: { clientId: googleId, clientSecret: googleSecret } } : {},
  });
}

export function useAuth() {
  const db = useDb();
  if (!db) throw createError({ statusCode: 503, message: "ระบบสมาชิกยังไม่พร้อม (ไม่ได้ตั้งค่าฐานข้อมูล)" });
  return (_auth ??= create(db));
}

const adminEmails = () =>
  (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

// แอดมิน = อีเมลอยู่ใน ADMIN_EMAILS และยืนยันอีเมลแล้ว (กันคนสมัครด้วยอีเมลแอดมินโดยไม่ยืนยัน)
export const isAdminUser = (u: { email: string; emailVerified: boolean }) =>
  u.emailVerified && adminEmails().includes(u.email.toLowerCase());

export const isAdminCandidate = (email: string) => adminEmails().includes(email.toLowerCase());

// รหัสแอดมินพิเศษ (ADMIN_KEY): ใช้แทนการยืนยันอีเมลได้ โดยอีเมลต้องอยู่ใน ADMIN_EMAILS ด้วย และต้องส่งรหัสมาทาง header x-admin-key
function adminKeyOk(event: H3Event) {
  const expected = process.env.ADMIN_KEY || "";
  const given = String(getRequestHeader(event, "x-admin-key") || "");
  if (expected.length < 12 || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function requireUser(event: H3Event) {
  // ใช้เฉพาะ header (ห้ามเรียก toWebRequest ที่นี่ เพราะจะอ่าน body ไปก่อนและทำให้ readBody ค้าง)
  const headers = new Headers();
  for (const [k, v] of Object.entries(getRequestHeaders(event))) if (v) headers.set(k, v);
  const s = await useAuth().api.getSession({ headers });
  if (!s) throw createError({ statusCode: 401, message: "กรุณาเข้าสู่ระบบ" });
  const isAdmin = isAdminUser(s.user) || (isAdminCandidate(s.user.email) && adminKeyOk(event));
  return { ...s.user, isAdmin };
}

export async function requireAdmin(event: H3Event) {
  const u = await requireUser(event);
  if (!u.isAdmin) throw createError({ statusCode: 403, message: "เฉพาะแอดมิน" });
  return u;
}
