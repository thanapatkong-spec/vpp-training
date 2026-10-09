import { defineCollection, defineContentConfig } from "@nuxt/content";
import { z } from "zod";

export default defineContentConfig({
  collections: {
    // หน้าเนื้อหาคงที่ (เกี่ยวกับ VPP, ความร่วมมือ) — แก้ผ่าน /admin/ (ไฟล์ content/pages/*.md)
    pages: defineCollection({
      type: "page",
      source: "pages/*.md",
      schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        cover: z.string().optional(),
      }),
    }),
    // คำถามที่ถามบ่อย — แก้ผ่าน /admin/ (ไฟล์ content/faq/*.yml)
    faq: defineCollection({
      type: "data",
      source: "faq/*.yml",
      schema: z.object({
        question: z.string(),
        answer: z.string(),
        order: z.number().default(100),
      }),
    }),
    // เอกสารแนบหน้าแรก — แก้ผ่าน /admin/ (ไฟล์ content/documents/*.yml)
    documents: defineCollection({
      type: "data",
      source: "documents/*.yml",
      schema: z.object({
        title: z.string(),
        file: z.string(),
        note: z.string().optional(),
        order: z.number().default(100),
      }),
    }),
    // บทความ/เนื้อหาอบรม — เพิ่มไฟล์ .md ในโฟลเดอร์ content/articles/
    articles: defineCollection({
      type: "page",
      source: "articles/*.md",
      schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.string(), // YYYY-MM-DD
        cohort: z.string().optional(), // เช่น "รุ่น พ.ย. 2569"
        draft: z.boolean().optional(),
        cover: z.string().optional(), // รูปปก เช่น /articles/cover.jpg (ไฟล์อยู่ใน public/articles/)
        files: z // ไฟล์ให้ดาวน์โหลด (ไฟล์อยู่ใน public/downloads/)
          .array(z.object({ title: z.string(), path: z.string(), note: z.string().optional() }))
          .optional(),
      }),
    }),
  },
});
