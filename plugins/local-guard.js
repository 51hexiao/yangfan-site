// 本地写作/版本接口的访问守卫（两个 dev 插件共用）。
//
// 威胁模型：dev server 开着时浏览恶意网页——
//   1. 盲 CSRF：恶意页面用 text/plain 的「CORS 简单请求」（不触发预检）向
//      /api/git/commit、/api/explore 等 POST 写操作，请求体会被照常解析执行，
//      后果是遥控本机提交/推送/改文章并触发自动部署。
//   2. DNS 重绑定：把域名解析到 127.0.0.1，让请求看起来「同源」。
// 对策：Host 只认 localhost 系（防重绑定）；带了 Origin 的请求必须与 Host 同源
// （浏览器对跨站与同源 POST 都会带 Origin，恶意页面的 Origin 对不上即拒）。
// 不带 Origin 的请求（curl、同源 GET）放行——能不带浏览器发请求的，本就有本机权限。

const LOCAL_HOST_RE = /^(localhost|127\.0\.0\.1|\[::1\]|::1)(:\d+)?$/i;

export function isTrustedLocal(req) {
  const host = String(req.headers.host ?? "").trim();
  if (!LOCAL_HOST_RE.test(host)) return false;

  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
