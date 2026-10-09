import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2026-01-01",
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],
  vite: { plugins: [tailwindcss()] },
  app: {
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
  },
});
