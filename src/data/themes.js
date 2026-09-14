/* 站点可选主题清单
   - id   写入 html[data-theme]，决定配色令牌（见 index.css）
   - mode 写入 html[data-mode]，light / dark，决定深色系的局部覆盖（如写作台纸面）
   - swatch 仅用于切换面板的迷你色块预览（底色 + 强调色），与 index.css 中的令牌值保持一致
   新增主题时三处同步：本文件 + index.css 令牌块 + index.html 首屏内联脚本 */
export const THEMES = [
  {
    id: "light",
    name: "暖纸",
    mode: "light",
    note: "默认 · 墨绿手账",
    swatch: ["#f6f2e7", "#173f37"],
  },
  {
    id: "dark",
    name: "墨绿夜",
    mode: "dark",
    note: "深色 · 深夜房间",
    swatch: ["#131b18", "#8fd8b6"],
  },
  {
    id: "celadon",
    name: "青瓷",
    mode: "light",
    note: "国风 · 天青釉",
    swatch: ["#e9f0ec", "#2f6b63"],
  },
  {
    id: "rouge",
    name: "胭脂",
    mode: "light",
    note: "暖调 · 胭脂扣",
    swatch: ["#fbf1f0", "#9b3b4e"],
  },
  {
    id: "brine",
    name: "海盐",
    mode: "light",
    note: "冷调 · 海盐蓝",
    swatch: ["#eef3f8", "#2f5d8a"],
  },
  {
    id: "dusk",
    name: "暮山",
    mode: "dark",
    note: "深色 · 暮山紫",
    swatch: ["#16131d", "#b39ddb"],
  },
  {
    id: "harvest",
    name: "秋分",
    mode: "dark",
    note: "深色 · 秋分棕",
    swatch: ["#1a1512", "#d9a05b"],
  },
];

export const DEFAULT_THEME_ID = "light";

export function getThemeById(id) {
  return THEMES.find((t) => t.id === id);
}
