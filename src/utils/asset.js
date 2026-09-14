// 站内资源路径统一处理：兼容 GitHub Pages 子路径部署（build base = /yangfan-site/）
// dev 下 BASE_URL 为 "/"，下列函数原样返回，不改变本地开发行为。
export const BASE_URL = import.meta.env.BASE_URL;

// 给以 "/" 开头的站内绝对路径资源补上部署基路径
// （外链 http(s)、协议相对 //、data: 等一律不动）
export function assetUrl(url) {
  const s = String(url ?? "");
  if (!s.startsWith("/") || s.startsWith("//")) return s;
  const base = BASE_URL.replace(/\/+$/, "");
  // 幂等：已带基路径的不重复拼接
  if (base && s.startsWith(`${base}/`)) return s;
  return base + s;
}

// Markdown 渲染产物（marked 输出）中的根路径 src/href 统一补前缀
// 只在 build 下改写，dev 下原样返回，保证 md 内容层纯净、不写死部署路径
// 幂等：已带基路径、协议相对路径（//cdn...）、锚点/外链均不改写
export function withBaseHtml(html) {
  const s = String(html ?? "");
  if (BASE_URL === "/") return s;
  const base = BASE_URL.replace(/\/+$/, "");
  return s.replace(
    /(\ssrc=|\shref=)(["'])(\/[^"']*)/g,
    (m, attr, quote, path) =>
      path.startsWith("//") || path.startsWith(`${base}/`)
        ? m
        : `${attr}${quote}${base}${path}`,
  );
}
