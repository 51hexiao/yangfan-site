// 私藏数据：书影音 / 好物工具 / 网站，改这个文件即生效（无需碰任何组件）
// 字段：type（类型键）· title（名称）· creator（作者/出品方）· note（一句推荐语）
//       url（链接，选填）· rating（1~5 星，选填）· emoji（选填图标）· date（选填，填了会上首页「最近动态」）
// 想下线一条就删掉一个对象，想置顶就把它挪到数组前面。

export const TYPE_LABEL = {
  book: "书",
  movie: "影",
  music: "音",
  stuff: "物",
  site: "站",
};

export const TYPE_EMOJI = {
  book: "📖",
  movie: "🎬",
  music: "🎧",
  stuff: "🧰",
  site: "🔗",
};

export const collections = [
  // —— 以下为示例条目，把内容换成你自己的即可 ——
  {
    type: "book",
    title: "三体",
    date: "2026-09-10",
    creator: "刘慈欣",
    note: "把中国科幻抬进世界视野的作品，三部一口气读完，后劲很大。",
    rating: 5,
  },
  {
    type: "movie",
    title: "星际穿越",
    date: "2026-09-05",
    creator: "克里斯托弗·诺兰",
    note: "硬核物理包裹着最软的父女情，配响起立。",
    rating: 5,
  },
  {
    type: "stuff",
    title: "Obsidian",
    creator: "Dynalist",
    note: "本地 Markdown 双链笔记，知识库长期主义选手的最爱。",
    url: "https://obsidian.md",
    rating: 4,
    emoji: "📝",
  },
  {
    type: "site",
    title: "阮一峰的网络日志",
    creator: "阮一峰",
    note: "每周科技爱好者周刊，信息筛选的标杆博客。",
    url: "https://www.ruanyifeng.com/blog/",
    rating: 5,
  },
];
