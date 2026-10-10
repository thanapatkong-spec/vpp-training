import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function useDb() {
  const url = useRuntimeConfig().databaseUrl;
  if (!url) return null;
  return (_db ??= drizzle(postgres(url, { max: 5 }), { schema }));
}
