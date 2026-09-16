/* 站内小管家的「工具层」：白名单动作、站内检索索引、主题/深浅色识别。
   这里只有纯函数，不碰 DOM 与路由；真正的跳转、换肤由组件拿到结果后执行。
   安全前提：模型能做的事完全由本文件的白名单决定，任何不在清单里的动作一律拒绝执行。 */

import { posts } from "./post.js";
import { trail } from "./explore.js";
import { collections, TYPE_LABEL as COLLECTION_TYPE_LABEL } from "../data/collections.js";
import { THEMES, DEFAULT_THEME_ID, getThemeById } from "../data/themes.js";
import { profileText } from "../data/profile.js";

/* ---------- 1. 页面白名单 ---------- */

export const PAGES = [
  { path: "/", label: "首页" },
  { path: "/blog", label: "博客" },
  { path: "/archive", label: "归档" },
  { path: "/explore", label: "探索" },
  { path: "/collections", label: "私藏" },
  { path: "/projects", label: "作品集" },
  { path: "/about", label: "关于我" },
];

/* 写作台只存在于本地开发，生产构建里连路由都不打包，这里同步门控 */
const DEV_PAGES = import.meta.env.DEV
  ? [
      { path: "/admin", label: "写作台" },
      { path: "/admin/git", label: "版本管理" },
      { path: "/explore/write", label: "记一笔" },
    ]
  : [];

export const ALL_PAGES = [...PAGES, ...DEV_PAGES];

const ALLOWED = new Set(ALL_PAGES.map((p) => p.path));

const stripTags = (html) =>
  String(html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/* ---------- 2. 站内检索索引（构建期数据，零网络开销） ---------- */

const INDEX = [
  ...posts.map((p) => ({
    kind: "文章",
    title: p.title,
    path: `/blog/${p.slug}`,
    meta: [p.tag, p.date].filter(Boolean).join(" · "),
    text: stripTags(p.content),
  })),
  ...trail.map((r) => ({
    kind: "足迹",
    title: r.title,
    path: `/explore/${r.slug}`,
    meta: [r.place, r.date].filter(Boolean).join(" · "),
    text: stripTags(r.content),
  })),
  ...collections.map((c) => ({
    kind: "私藏",
    title: c.title,
    path: "/collections",
    meta: [COLLECTION_TYPE_LABEL[c.type], c.creator].filter(Boolean).join(" · "),
    text: String(c.note ?? ""),
  })),
];

/* 中文没空格：整串 + 2-gram 一起参与匹配，够用且够快 */
function tokenize(query) {
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) return [];
  const parts = q.split(/[\s,，、。.？?！!；;：:"'“”()（）]+/).filter(Boolean);
  const grams = [];
  for (const part of parts) {
    if (/[\u4e00-\u9fa5]/.test(part) && part.length > 2) {
      for (let i = 0; i < part.length - 1; i++) grams.push(part.slice(i, i + 2));
    }
  }
  return [...new Set([...parts, ...grams])];
}

function scoreItem(item, tokens) {
  const title = item.title.toLowerCase();
  const meta = item.meta.toLowerCase();
  const text = item.text.toLowerCase();
  let score = 0;
  for (const t of tokens) {
    if (!t) continue;
    if (title.includes(t)) score += 6;
    if (meta.includes(t)) score += 3;
    const hits = text.split(t).length - 1;
    if (hits) score += Math.min(hits, 4);
  }
  return score;
}

/** 站内检索：返回 [{ kind, title, path, meta }]，最多 limit 条 */
export function searchSite(query, limit = 5) {
  const tokens = tokenize(query);
  if (!tokens.length) return [];
  return INDEX.map((item) => ({ item, score: scoreItem(item, tokens) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item }) => ({ kind: item.kind, title: item.title, path: item.path, meta: item.meta }));
}

/** 按标题/slug 找一篇内容（先精确后包含），找不到返回 null */
export function findContent(input) {
  const q = String(input ?? "").trim().toLowerCase();
  if (!q) return null;
  const all = [
    ...posts.map((p) => ({ kind: "文章", title: p.title, slug: p.slug, path: `/blog/${p.slug}` })),
    ...trail.map((r) => ({ kind: "足迹", title: r.title, slug: r.slug, path: `/explore/${r.slug}` })),
  ];
  return (
    all.find((x) => x.slug.toLowerCase() === q) ??
    all.find((x) => x.title.toLowerCase() === q) ??
    all.find((x) => x.title.toLowerCase().includes(q) || q.includes(x.title.toLowerCase())) ??
    null
  );
}

/* ---------- 3. 路径与主题归一化 ---------- */

/** 把模型给的路径 / 中文页名归一化成合法站内路径；不合法返回 null */
export function resolvePath(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return null;
  const cleaned = raw.replace(/^#/, "").replace(/^https?:\/\/[^/]+/i, "").replace(/\s+/g, "");
  const path = (cleaned.startsWith("/") ? cleaned : `/${cleaned}`).replace(/\/+$/, "") || "/";

  if (ALLOWED.has(path)) return path;

  const byLabel = ALL_PAGES.find(
    (p) => p.label === cleaned || p.label === cleaned.replace(/^\//, "") || p.path.slice(1) === cleaned,
  );
  if (byLabel) return byLabel.path;

  const m = path.match(/^\/(blog|explore)\/([^/]+)$/);
  if (m) {
    const ok =
      m[1] === "blog" ? posts.some((p) => p.slug === m[2]) : trail.some((r) => r.slug === m[2]);
    if (ok) return path;
  }
  return null;
}

export function labelOfPath(path) {
  return (
    ALL_PAGES.find((p) => p.path === path)?.label ??
    (path.startsWith("/blog/") ? "文章详情" : path.startsWith("/explore/") ? "足迹详情" : path)
  );
}

/* 主题别名：模型说"深色""国风""紫色"也能对上号 */
const THEME_ALIAS = {
  light: ["浅色", "亮色", "白", "白天", "日间", "默认", "暖纸", "墨绿", "原色", "原味"],
  dark: ["深色", "暗色", "黑", "夜间", "夜晚", "墨绿夜", "暗"],
  celadon: ["青瓷", "国风", "天青", "天青釉", "青", "绿"],
  rouge: ["胭脂", "胭脂扣", "红", "暖调", "粉"],
  brine: ["海盐", "海盐蓝", "蓝", "冷调"],
  dusk: ["暮山", "暮山紫", "紫"],
  harvest: ["秋分", "秋分棕", "棕", "褐", "咖"],
};

/** 主题 id / 中文名 / 别名 → 主题对象；识别不出返回 null */
export function resolveTheme(input, mode) {
  const q = String(input ?? "").trim().toLowerCase();
  const byId = THEMES.find((t) => t.id === q || t.name === q);
  if (byId) return mode ? (byId.mode === mode ? byId : null) : byId;
  const hit = THEMES.find((t) => (THEME_ALIAS[t.id] ?? []).some((a) => a === q || q.includes(a)));
  if (hit) return mode ? (hit.mode === mode ? hit : null) : hit;
  return null;
}

/** light / dark / 深色 / 浅色 → 对应主题对象 */
export function resolveModeTheme(input) {
  const q = String(input ?? "").trim().toLowerCase();
  if (/^(dark|deep|night|深|暗|夜|黑)/.test(q)) return getThemeById("dark");
  if (/^(light|bright|day|浅|亮|白|日)/.test(q)) return getThemeById(DEFAULT_THEME_ID);
  return resolveTheme(q);
}

/* ---------- 4. 给模型的站点上下文 ---------- */

export function siteContextText() {
  const lines = [];
  lines.push("【站点】肥仔妙妙屋 · 个人网站（React + Vite 单页应用，内容多为示例，可以当真实数据用）");
  lines.push(profileText());
  lines.push(
    `【页面】${ALL_PAGES.map((p) => `${p.label}=${p.path}`).join(" · ")}；文章详情=/blog/<slug>；足迹详情=/explore/<slug>`,
  );
  lines.push(
    `【文章】${
      posts.length ? posts.map((p) => `《${p.title}》(${p.date || "无日期"}·${p.tag}·slug:${p.slug})`).join(" ") : "暂无"
    }`,
  );
  lines.push(
    `【足迹】${
      trail.length
        ? trail.map((r) => `《${r.title}》(${r.date || "无日期"}·${r.place || "无地点"}·slug:${r.slug})`).join(" ")
        : "暂无"
    }`,
  );
  lines.push(
    `【私藏】${
      collections.length
        ? collections.map((c) => `${c.title}(${COLLECTION_TYPE_LABEL[c.type] ?? c.type}·${c.creator ?? "佚名"})`).join(" ")
        : "暂无"
    }`,
  );
  lines.push(
    `【可选配色】${THEMES.map((t) => `${t.name}=${t.id}(${t.mode === "dark" ? "深色" : "浅色"})`).join(" ")}`,
  );
  return lines.join("\n");
}

/* ---------- 5. 动作指令解析 ---------- */

const ACT_RE = /@@ACT\s*([\s\S]*?)@@/g;

/** 从模型回复里剥离动作指令，返回 { text, actions } */
export function parseActions(raw) {
  const actions = [];
  const cleaned = String(raw ?? "").replace(ACT_RE, (_m, json) => {
    try {
      const obj = JSON.parse(String(json).trim());
      if (obj && typeof obj === "object") actions.push(obj);
    } catch {
      /* 模型写坏了 JSON 就当没有动作，只保留文字 */
    }
    return "";
  });
  return { text: plainText(cleaned), actions: actions.slice(0, 2) };
}

/** 极简去 Markdown 记号：助手气泡走纯文本渲染，不留 ** 与 ## */
export function plainText(text) {
  return String(text ?? "")
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```[a-z]*\n?/g, ""))
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(^|\s)\*(?!\s)(.+?)\*/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "· ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
