import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  modules: ["@nuxt/content"],
  compatibilityDate: "2026-01-01",
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],
  vite: { plugins: [tailwindcss()] },
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || "/",
    head: {
      htmlAttrs: { lang: "th" },
      title: "VPP · Training & Competency System for Veterinary Hospital",
      meta: [
        {
          name: "description",
          content:
            "หลักสูตรผู้ช่วยสัตวแพทย์ด้านการพยาบาลสัตว์ สร้างทีมที่มีพื้นฐาน ลดภาระการสอนงาน ยกระดับมาตรฐานโรงพยาบาลสัตว์",
        },
      ],
    },
  },
  runtimeConfig: {
    databaseUrl: "", // NUXT_DATABASE_URL (หรือ DATABASE_URL ผ่าน drizzle-kit)
    public: {
      membersEnabled: false, // NUXT_PUBLIC_MEMBERS_ENABLED=true เมื่อ deploy แบบมีเซิร์ฟเวอร์ (Vercel) แล้วเท่านั้น
      googleLogin: false, // NUXT_PUBLIC_GOOGLE_LOGIN=true เมื่อตั้ง GOOGLE_CLIENT_ID/SECRET แล้ว
    },
  },
  // หน้าสมาชิกเรนเดอร์ฝั่งเบราว์เซอร์ (ต้องใช้ session)
  routeRules: {
    "/login": { ssr: false },
    "/signup": { ssr: false },
    "/forgot-password": { ssr: false },
    "/reset-password": { ssr: false },
    "/account": { ssr: false },
    "/manage": { ssr: false },
    "/activate": { ssr: false },
    "/apply": { ssr: false },
  },
});
