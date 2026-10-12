import { marked } from "marked";

// Markdown (เขียนโดยแอดมิน) → HTML · ลิงก์ภายนอกเปิดแท็บใหม่ · ตัด <script>/on*= ออกกันโค้ดแปลกปลอม
const renderer = new marked.Renderer();
const baseLink = renderer.link.bind(renderer);
renderer.link = (tok) => {
  const html = baseLink(tok);
  return /^https?:\/\//.test(tok.href) ? html.replace(/^<a /, '<a target="_blank" rel="noopener" ') : html;
};
export function renderMarkdown(md: string | null | undefined) {
  const html = marked.parse(md || "", { renderer, async: false, gfm: true, breaks: false }) as string;
  return html
    .replace(/<\s*(script|iframe|object|embed|style)[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"');
}
