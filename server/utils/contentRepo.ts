// อ่าน/เขียนไฟล์เนื้อหาใน GitHub repo ผ่าน Contents API (บันทึก = commit เข้า main → เว็บ deploy ใหม่เอง)
export interface RepoFile { sha: string; content: Buffer }

function cfg() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw createError({ statusCode: 503, message: "ยังไม่ได้ตั้งค่า GITHUB_TOKEN บน Vercel (ดูวิธีตั้งค่าในหน้าเนื้อหาเว็บ)" });
  return {
    token,
    api: (process.env.GITHUB_API_URL || "https://api.github.com").replace(/\/$/, ""),
    repo: process.env.GITHUB_REPO || "thanapatkong-spec/vpp-training",
    branch: process.env.GITHUB_BRANCH || "main",
  };
}

async function gh(method: string, path: string, body?: unknown) {
  const c = cfg();
  const url = `${c.api}/repos/${c.repo}/contents/${path.split("/").map(encodeURIComponent).join("/")}`;
  const res = await fetch(method === "GET" ? `${url}?ref=${encodeURIComponent(c.branch)}` : url, {
    method,
    headers: { Authorization: `Bearer ${c.token}`, Accept: "application/vnd.github+json", "User-Agent": "vpp-admin", "X-GitHub-Api-Version": "2022-11-28", ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify({ ...(body as object), branch: c.branch }) : undefined,
  });
  if (res.status === 404) return null;
  if (res.status === 401 || res.status === 403) throw createError({ statusCode: 502, message: "GITHUB_TOKEN ไม่มีสิทธิ์เขียน repo (ต้องมีสิทธิ์ Contents: Read and write)" });
  if (res.status === 409 || res.status === 422) throw createError({ statusCode: 409, message: "ไฟล์ถูกแก้ไขจากที่อื่นไปแล้ว กรุณาเปิดรายการใหม่แล้วลองอีกครั้ง" });
  if (!res.ok) throw createError({ statusCode: 502, message: `GitHub ตอบกลับผิดพลาด (${res.status})` });
  return res.json();
}

export async function repoList(dir: string): Promise<string[]> {
  const r = await gh("GET", dir);
  return Array.isArray(r) ? r.filter((f: any) => f.type === "file").map((f: any) => f.name as string) : [];
}

export async function repoRead(path: string): Promise<RepoFile | null> {
  const r = await gh("GET", path);
  if (!r || Array.isArray(r)) return null;
  // ไฟล์ >1MB Contents API ไม่ส่ง content มาให้ (ไฟล์เนื้อหาของเราเป็นข้อความเล็ก ไม่ถึงขนาดนั้น)
  return { sha: r.sha, content: Buffer.from(r.content || "", "base64") };
}

export async function repoWrite(path: string, content: Buffer, message: string, sha?: string) {
  await gh("PUT", path, { message, content: content.toString("base64"), ...(sha ? { sha } : {}) });
}

export async function repoDelete(path: string, sha: string, message: string) {
  await gh("DELETE", path, { message, sha });
}
