import { marked } from "marked";
import { sanitizeHtml } from "./sanitizeHtml.js";
import { withBaseHtml } from "./asset.js";

// 构建时加载 posts/ 目录下所有 Markdown 文件（Vite 编译期处理，非运行时 IO）
// 草稿双保险：① 文件名以 .draft.md 结尾（生产构建连内容一起剔除，推荐）
// ② frontmatter 加 draft: true（仅生产列表隐藏，内容仍在 bundle，写敏感内容请用①）
const isDev = import.meta.env.DEV;

const prodFiles = import.meta.glob(
  ["../../posts/*.md", "!../../posts/*.draft.md"],
  { query: "?raw", import: "default", eager: true },
);
const draftFiles = import.meta.glob("../../posts/*.draft.md", {
  query: "?raw",
  import: "default",
  eager: true,
});
const files = { ...prodFiles, ...(isDev ? draftFiles : {}) };

// 解析 YAML frontmatter 的轻量子集：仅支持 "key: value" 形式
function parseFrontmatter(text) {
  const meta = {};
  const lines = text.split(/\r?\n/);
  let i = 0;
  if (lines[0]?.trim() !== "---") return { meta, body: text };
  for (i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "---") {
      i++;
      break;
    }
    const idx = line.indexOf(":");
    if (idx > 0) {
      meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
  }
  return { meta, body: lines.slice(i).join("\n") };
}

export const posts = Object.entries(files)
  .map(([path, raw]) => {
    const { meta, body } = parseFrontmatter(raw);
    return {
      slug: meta.slug ?? path.match(/\/([^/]+)\.md$/)[1],
      title: meta.title ?? "无标题",
      date: meta.date ?? "",
      tag: meta.tag ?? "未分类",
      draft: path.endsWith(".draft.md") || /^(true|1|yes)$/i.test(meta.draft ?? ""),
      excerpt: meta.excerpt ?? body.replace(/[#>*`\-\n]/g, " ").trim().slice(0, 80) + "…",
      content: sanitizeHtml(withBaseHtml(marked.parse(body))),
    };
  })
  .filter((p) => isDev || !p.draft)
  .sort((a, b) => b.date.localeCompare(a.date));

// 中文约 400 字/分钟
export function readingTime(post) {
  const text = post.content.replace(/<[^>]+>/g, "");
  const minutes = Math.max(1, Math.round(text.length / 400));
  return `${minutes} 分钟阅读`;
}

export const allTags = ["全部", ...new Set(posts.map((p) => p.tag))];

export default posts;
