import { defineCollection, defineContentConfig } from "@nuxt/content";
import { z } from "zod";

export default defineContentConfig({
  collections: {
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
      }),
    }),
  },
});
