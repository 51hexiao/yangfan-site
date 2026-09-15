import { marked } from "marked";
import { sanitizeHtml } from "./sanitizeHtml.js";
import { assetUrl, withBaseHtml } from "./asset.js";

// 构建时加载 explore/ 目录下所有 Markdown（Vite 编译期处理，非运行时 IO）
// 草稿约定同 post.js：*.draft.md 生产完全剔除；frontmatter draft: true 仅隐藏列表
const prodFiles = import.meta.glob(
  ["../../explore/*.md", "!../../explore/*.draft.md"],
  { query: "?raw", import: "default", eager: true },
);
const draftFiles = import.meta.glob("../../explore/*.draft.md", {
  query: "?raw",
  import: "default",
  eager: true,
});
const isDev = import.meta.env.DEV;
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

const toList = (v) =>
  String(v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export const TYPE_LABEL = { food: "吃饭", spot: "景点" };

function buildRecord(path, raw) {
  const { meta, body } = parseFrontmatter(raw);
  const slug = meta.slug || path.match(/\/([^/]+)\.md$/)[1];
  const lat = Number(meta.lat);
  const lng = Number(meta.lng);
  // 图片路径统一补部署基路径（md 原文保持 /uploads/... 不变）
  const images = [...toList(meta.images), ...toList(meta.cover)].map(assetUrl);
  const text = body.trim();
  return {
    slug,
    title: meta.title || meta.place || "未命名的一笔",
    date: meta.date ?? "",
    type: meta.type === "food" ? "food" : "spot",
    icon: String(meta.icon ?? "").trim(),
    draft: path.endsWith(".draft.md") || /^(true|1|yes)$/i.test(meta.draft ?? ""),
    place: meta.place ?? "",
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    cover: images[0] ?? "",
    images: [...new Set(images)],
    hasGeo: Number.isFinite(lat) && Number.isFinite(lng),
    excerpt: text
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/[#>*`~\-\n]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 44),
    content: sanitizeHtml(withBaseHtml(marked.parse(text))),
  };
}

// 时间正序：早的在前，序号即「第几站」
export const trail = Object.entries(files)
  .map(([path, raw]) => buildRecord(path, raw))
  .filter((r) => isDev || !r.draft)
  .sort((a, b) => (a.date + a.slug).localeCompare(b.date + b.slug))
  .map((r, i) => ({ ...r, no: i + 1 }));

// 最新在前：给列表、卡流用
export const records = [...trail].reverse();

export const counts = {
  all: trail.length,
  food: trail.filter((r) => r.type === "food").length,
  spot: trail.filter((r) => r.type === "spot").length,
};

export const years = [...new Set(trail.map((r) => (r.date || "").slice(0, 4)).filter(Boolean))];

// 「杭州 · 河坊街」→「杭州」：地点文案以 · / ／ / - 分隔时取首段当城市
// 无分隔符的地址（多为地图点选的逆地理结果）则剥掉省/自治区，取到「市/州/盟」为止
export function cityOf(place) {
  const s = String(place ?? "").trim();
  if (!s) return "";
  if (/[·／/、]|-/.test(s)) {
    return s.split(/[·／/、]|-/)[0].trim() || s;
  }
  const m = s.match(/^(?:[^省]+省|[^区]+自治区)?([^市州盟]+[市州盟])/);
  return m ? m[1] : s;
}

// 两点间球面距离（km），haversine 公式，避免为算里程引入 AMap 依赖
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

// 沿时间顺序把有坐标的相邻站点连起来，累计的直线距离即「足迹里程」
export function pathKm(list) {
  let sum = 0;
  for (let i = 1; i < list.length; i++) {
    sum += haversineKm(list[i - 1].lat, list[i - 1].lng, list[i].lat, list[i].lng);
  }
  return sum;
}

export const totalKm = Math.round(pathKm(trail.filter((r) => r.hasGeo)));

export const photoCount = trail.reduce((n, r) => n + r.images.length, 0);

export const cityCount = new Set(trail.map((r) => cityOf(r.place)).filter(Boolean)).size;

// 相邻两站间隔几天（用于「— 间隔 N 天 —」旅程叙事）；任一头没有日期返回 null
export function gapDays(prev, next) {
  if (!prev?.date || !next?.date) return null;
  const a = new Date(prev.date);
  const b = new Date(next.date);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  const diff = Math.round((b - a) / 86400000);
  return diff > 0 ? diff : null;
}

export default trail;
