import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function useDb() {
  // NUXT_DATABASE_URL หรือ DATABASE_URL (ที่ Vercel + Neon ฉีดให้อัตโนมัติ)
  const url = useRuntimeConfig().databaseUrl || process.env.DATABASE_URL;
  if (!url) return null;
  return (_db ??= drizzle(postgres(url, { max: 3, prepare: false }) /* prepare:false รองรับ connection pooler ของ Neon */, { schema }));
}
