import fs from "node:fs";
import path from "node:path";
import { loadEnv } from "vite";

// 构建收尾时生成 rss.xml 与 sitemap.xml（纯静态，随 dist 一起部署）
// 站点地址从 .env 的 SITE_URL 读取；未配置时用占位域名并提示。

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

const esc = (s) =>
  String(s ?? "").replace(
    /[<>&'"]/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c],
  );

const strip = (s) =>
  String(s ?? "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/[#>*`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const slugOf = (f) => f.replace(/\.md$/, "");

function readDirMd(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const { meta, body } = parseFrontmatter(fs.readFileSync(path.join(dir, f), "utf8"));
      return {
        slug: meta.slug || slugOf(f),
        title: meta.title || meta.place || slugOf(f),
        date: meta.date || "",
        tag: meta.tag || meta.type || "",
        text: strip(body).slice(0, 300),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export default function siteMeta(mode) {
  return {
    name: "site-meta",
    apply: "build",
    closeBundle() {
      const env = loadEnv(mode, process.cwd(), "");
      const site = (env.SITE_URL || "https://example.com").replace(/\/$/, "");
      if (!env.SITE_URL) {
        console.log("[site-meta] 未配置 SITE_URL，rss/sitemap 里的链接暂用占位域名；定了域名后写进 .env 再构建即可");
      }
      const root = process.cwd();
      const dist = path.resolve(root, "dist");
      if (!fs.existsSync(dist)) return;

      const posts = readDirMd(path.join(root, "posts"));
      const explores = readDirMd(path.join(root, "explore"));

      // —— sitemap.xml ——
      const staticPaths = ["", "/blog", "/archive", "/explore", "/collections", "/projects", "/about"];
      // HashRouter 站点的真实可访问地址是 /#/path 形式
      const page = (p) => `${site}/#${p}`;
      const urls = [
        ...staticPaths.map((p) => page(p || "/")),
        ...posts.map((p) => page(`/blog/${p.slug}`)),
        ...explores.map((p) => page(`/explore/${p.slug}`)),
      ];
      fs.writeFileSync(
        path.join(dist, "sitemap.xml"),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map((u) => `  <url><loc>${esc(u)}</loc></url>`)
          .join("\n")}\n</urlset>\n`,
        "utf8",
      );

      // —— rss.xml ——
      const items = [
        ...posts.map((p) => ({ ...p, link: page(`/blog/${p.slug}`), cat: p.tag || "博客" })),
        ...explores.map((p) => ({ ...p, link: page(`/explore/${p.slug}`), cat: "足迹" })),
      ]
        .filter((p) => p.date)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 30);

      const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>肥仔妙妙屋</title>
<link>${esc(site)}</link>
<description>杨帆的手记、足迹与私藏</description>
${items
  .map(
    (p) => `<item>
<title>${esc(p.title)}</title>
<link>${esc(p.link)}</link>
<guid>${esc(p.link)}</guid>
<pubDate>${new Date(p.date).toUTCString()}</pubDate>
<category>${esc(p.cat)}</category>
<description>${esc(p.text)}</description>
</item>`,
  )
  .join("\n")}
</channel></rss>\n`;
      fs.writeFileSync(path.join(dist, "rss.xml"), rss, "utf8");

      console.log(`[site-meta] rss.xml（${items.length} 条）与 sitemap.xml（${urls.length} 个地址）已生成`);
    },
  };
}
