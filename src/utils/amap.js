// 高德地图 JS API 2.0 加载器（唯一外部依赖，key 走 .env.local）
//
// 配置方式：项目根目录建 .env.local，写入两行后重启 npm run dev
//   VITE_AMAP_KEY=你的 Web端(JS API) key
//   VITE_AMAP_SECURITY=对应的安全密钥 jscode
// 未配置时地图区域降级为提示卡，其余功能（列表、详情、写作）不受影响。

const KEY = String(import.meta.env.VITE_AMAP_KEY ?? "").trim();
const SECURITY = String(import.meta.env.VITE_AMAP_SECURITY ?? "").trim();

export const hasAmapKey = Boolean(KEY);

export const AMAP_PLUGINS =
  "AMap.AutoComplete,AMap.PlaceSearch,AMap.Geocoder,AMap.MoveAnimation,AMap.Geolocation";

let loading = null;

export function loadAmap() {
  if (!hasAmapKey) return Promise.reject(new Error("AMAP_KEY_MISSING"));
  if (typeof window !== "undefined" && window.AMap) return Promise.resolve(window.AMap);
  if (loading) return loading;

  loading = new Promise((resolve, reject) => {
    if (SECURITY) window._AMapSecurityConfig = { securityJsCode: SECURITY };
    const script = document.createElement("script");
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(
      KEY,
    )}&plugin=${encodeURIComponent(AMAP_PLUGINS)}`;
    script.async = true;
    script.onload = () =>
      window.AMap ? resolve(window.AMap) : reject(new Error("高德脚本已加载，但未挂载 AMap"));
    script.onerror = () => {
      loading = null;
      reject(new Error("高德脚本加载失败：检查网络，或 key 是否设置了域名白名单"));
    };
    document.head.appendChild(script);
  });

  return loading;
}

// 跟随站点明暗模式切换底图风格
export function mapStyleFor(mode) {
  return mode === "dark" ? "amap://styles/darkblue" : "amap://styles/whitesmoke";
}

// 读取站点设计令牌，让地图元素跟主题配色走
export function cssVar(name, fallback) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

// 当前站点是 light 还是 dark（ThemeToggle 写在 html 上）
export function currentMode() {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.mode === "dark" ? "dark" : "light";
}

export function escapeHtml(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}
