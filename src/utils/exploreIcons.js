// 探索图钉的图标预设：发布时可手动选；不选则按地点类型自动匹配一个
// 数据层只存 emoji 字符串（explore/*.md 的 icon 字段），渲染时找不到就直接用类型兜底

export const EXPLORE_ICONS = [
  { emoji: "🍜", label: "吃饭" },
  { emoji: "☕", label: "咖啡" },
  { emoji: "🍻", label: "小酒馆" },
  { emoji: "🍰", label: "甜品" },
  { emoji: "🏞️", label: "风光" },
  { emoji: "🏛️", label: "古迹" },
  { emoji: "🌉", label: "地标" },
  { emoji: "🛍️", label: "逛街" },
  { emoji: "⛺", label: "露营" },
  { emoji: "🚶", label: "漫步" },
];

export const typeEmoji = (type) => (type === "food" ? "🍜" : "🏞️");

export const isKnownIcon = (v) =>
  EXPLORE_ICONS.some((i) => i.emoji === v);

// 记录最终要显示的 emoji：自己配过的 > 类型兜底
export function iconEmoji(record) {
  return record?.icon || typeEmoji(record?.type);
}

// 按高德 POI 的类型码 / 名称关键词选一个预设图标；匹配不上返回 null（用类型兜底）
export function matchIcon(poi) {
  const typecode = String(poi?.typecode ?? "");
  const text = `${poi?.type ?? ""} ${poi?.name ?? ""}`;

  // 餐饮细分（typecode 05 开头都是餐饮服务）
  if (/咖啡|茶座|奶茶|tea|coffee/i.test(text)) return "☕";
  if (/酒吧|酒馆|清吧|pub|bar/i.test(text)) return "🍻";
  if (/甜品|蛋糕|烘焙|面包|糕点/.test(text)) return "🍰";
  if (typecode.startsWith("05") || /餐厅|美食|饭馆|菜馆|小吃|快餐|火锅|烧烤|食堂|面/.test(text)) {
    return "🍜";
  }

  // 游览细分
  if (/博物馆|纪念馆|美术馆|展览|寺庙|庙|祠|故居|遗址|古迹/.test(text)) return "🏛️";
  if (/露营|营地|野餐/.test(text)) return "⛺";
  if (/购物|商场|商业|步行街|市场|百货/.test(text)) return "🛍️";
  if (/桥|塔|城堡|教堂|广场|地标|电视塔/.test(text)) return "🌉";
  if (/公园|湖|山|江|河|海|湾|瀑布|森林|湿地|风景|景区|峡谷|泉/.test(text)) return "🏞️";
  return null;
}
