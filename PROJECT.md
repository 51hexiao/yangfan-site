# 我的小站 — 项目文档

> 本文档是项目的唯一事实来源，记录当前进度、架构决策与未来规划。
> 目标：**可持续、独立** —— 任何人（或任何 AI 助手）接手时，读完本文档即可继续开发。

- 项目位置：`C:\Users\75123\Desktop\个人网站`
- 创建时间：2026-09-08
- 维护者：站长本人（CS 研究生）
- 文档约定：每次完成或调整工作，**必须同步更新本文档**的「当前进度」和「下一步计划」。

---

## 一、项目定位与原则

1. **综合型个人网站**：个人主页 + 博客 + 作品集 + 关于我。
2. **风格**：简约现代（大量留白、卡片、圆角、微动效），支持深色模式。
3. **阶段策略**：现阶段纯本地自娱自乐；未来可能上线公开。所有决策以「平滑演进、不作废已有工作」为准。
4. **独立性原则**：不深度绑定任何特定 AI 助手或付费服务；核心技术选型用主流、文档完善、社区活跃的方案；内容（文章）用 Markdown 纯文本存储，永远可迁移。

## 二、技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端框架 | React 19 + Vite 8 | `npm create vite` 脚手架起步 |
| 路由 | react-router-dom v7 | BrowserRouter，含 `/blog/:slug` 动态路由 |
| 样式 | 原生 CSS（单文件 `src/index.css`） | 设计令牌定义在 `:root` 与 `[data-mode="dark"]`，主题切换基于 `data-theme` + `data-mode` 双属性 |
| 内容 | `posts/*.md`（frontmatter + Markdown 正文） | 构建时经 `import.meta.glob` 读入，`marked` 渲染 |
| 后端 | 暂无 | 规划中，见「路线图」第 3 步 |

## 三、目录结构

```
个人网站/
├── index.html              # 入口 HTML（标题、favicon、meta）
├── public/favicon.svg      # 渐变色 Z 字图标
├── posts/                  # ★ 博客文章（Markdown + frontmatter）
│   └── *.md                #    头部：title/slug/date/tag；正文：Markdown
├── PROJECT.md              # 本文档
└── src/
    ├── main.jsx            # 挂载 + BrowserRouter
    ├── App.jsx             # 路由表 + 导航栏 + 页脚
    ├── index.css           # 全部样式（设计令牌在此定义）
    ├── components/
    │   ├── SailLoader.jsx        # 懒加载动画：帆船 GIF/WebP + 呼吸文字（已集成到 App.jsx 路由切换）
    │   ├── SailLoader.css
    │   ├── ThemeToggle.jsx       # 主题切换按钮（双色块图标，非太阳/月亮）
    │   └── ThemeToggle.css
    │       ├── .theme-toggle       # 按钮本体
    │       └── .theme-menu         # 弹出式配色下拉面板
    ├── pages/
    │   ├── Home.jsx        # 首页：Hero + 最新文章 + 精选项目
    │   ├── Blog.jsx        # 博客列表：分类筛选 + 阅读时长
    │   ├── BlogPost.jsx    # 文章详情
    │   ├── Projects.jsx    # 作品集
    │   └── About.jsx       # 关于我
    ├── data/
    │   ├── projects.js     # 项目数据（暂为 JS，远期可同样迁为 md）
    │   └── themes.js       # ★ 主题配色清单：7 套配色 id → design token 映射
    └── utils/
        └── post.js         # ★ 内容层：glob 加载 posts/*.md、解析 frontmatter、marked 渲染、阅读时长、标签列表
```

## 四、常用命令

```bash
npm run dev      # 开发服务器（当前用 5174 端口启动）
npm run build    # 产物输出到 dist/，已验证可构建
npm run preview  # 本地预览构建产物
```

注意：换端口的原因是 5173 曾被浏览器 HTTP 缓存卡住显示旧代码，强刷（Ctrl+Shift+R）可解决。

## 五、当前进度（2026-09-08）

**已完成：**
- [x] Vite + React 脚手架与基础依赖
- [x] 四个页面（首页/博客/作品集/关于）+ 路由 + 响应式布局
- [x] 深色模式：切换按钮、localStorage 持久化、跟随系统偏好
- [x] 博客：分类筛选胶囊、阅读时长、文章详情页
- [x] 渐变色 favicon、中文 SEO 基础 meta
- [x] 版面加宽至 1100px（大屏两侧留白）
- [x] 生产构建通过
- [x] 浏览器实测验收：主题切换、筛选、详情页均通过
- [x] 路由懒加载分包 + 帆船加载动画 SailLoader（2026-09-09）
- [x] 主题配色系统：7 套配色（暖纸 / 墨绿夜 / 青瓷 / 胭脂 / 海盐 / 暮山 / 秋分），双色块图标，下拉面板切换，首屏防闪烁（2026-09-11）
- [x] 关于我页重做为与首页同源的编辑日志风：方形头像双层纸片名片 + 01 这间妙妙屋（首段引言化 + 首字下沉）/ 02 最近在做（方框进行中标记的条目行）/ 03 技能（手账标签），GitHub 链接补为 `51hexiao`（2026-09-11）
- [x] 关于页浏览器实测：浅色/深色桌面（1440）+ 手机视口（390）截图验收通过，无溢出无截断（2026-09-11）
- [x] 关于页三轮美化收口：整页点阵纸底纹 + 姓名奶油笔触 + 段末落款 + 02 方框/03 标签微交互（2026-09-11）
- [x] 关于页宽屏页边装置：左右页边竖线 + 132px 内侧刻度 + 竖排书签「关于我 · ABOUT」/「肥仔妙妙屋 · MIAOMIAOWU」，小屏自动收起（2026-09-11）

**当前文章内容**：3 篇示例文章位于 `posts/`（随笔/技术/生活 各一），全部为占位示例，待替换为真实内容。

### 2026-09-08 更新：Markdown 内容层已落地（路线图第 1 步完成）
- `posts/*.md` 为唯一文章来源：frontmatter 支持 `title/slug/date/tag`（`excerpt` 可选，缺省自动截取正文前 80 字）。
- `src/utils/post.js` 在构建时通过 `import.meta.glob("../../posts/*.md", { query: "?raw", eager: true })` 读入并解析。
- 正文用 `marked` 渲染为 HTML（支持代码块、行内代码等），文章按日期倒序。
- 新增依赖：`marked`。
- **踩坑记录**：
  1. glob 路径必须相对 `src/utils/` 写 `../../posts/`（曾误写 `../posts/` 导致解析到不存在的 `src/posts/`，dev 与 build 均静默返回空）。
  2. `import.meta.glob` 的 `as: "raw"` 旧写法在本环境（rolldown-vite）构建时会失败，必须用 `query: "?raw", import: "default"`。
- **写作方式**：在 `posts/` 新建 `.md` 文件即发布一篇；删除文件即下线；dev 模式下保存即时热更新。

### 2026-09-08 更新：首页 Hero 背景图已上线
- 新增 `public/hero-bg.png`（卡通插画背景图，来自用户提供的图片）。
- 首页 Hero 区块改为全宽背景图（`background-size: cover` 铺满、居中裁剪），叠加半透明深色渐变遮罩保证文字可读性；标题、描述、描边按钮改为白色系并加文字阴影。
- 结构调整：Hero 区块从 `.container.page` 中移出以撑满全宽，内部内容仍用 `.container` 约束宽度；下方正文容器改用 `home-content` 压缩顶部间距。
- `npm run build` 已验证通过，产物含 `dist/hero-bg.png`。

### 2026-09-08 更新：个人头像已替换
- 新增 `public/avatar.jpg`（站长个人照片，358x441 低分辨率原图，保持可用）。
- 首页 Hero 区头像由「渐变圆 + Hi 文字」改为真实照片：Home.jsx 的 `.hero-avatar` 内改为 `<img src="/avatar.jpg">`，CSS 以 `object-fit: cover` 裁切为圆形。
- 站点其他页面目前无头像引用；`src/assets/hero.png` 等为模板残留资源，未被使用。
- `npm run build` 已验证通过，产物含 `dist/avatar.jpg`。

### 2026-09-08 更新：真实个人信息已替换
- 首页 Hero 标题改为「你好，我是 YangFan」。
- 关于我页邮箱改为真实邮箱：`mailto:15279620917@162.com`（链接文字同时显示真实邮箱）。
- 站点名统一为「肥仔妙妙屋」：`index.html` 的 `<title>` 与 meta description、导航栏站点名、页脚署名均已更新。
- `npm run build` 已验证通过。

### 2026-09-08 更新：首页副标题文案个性化
- Home.jsx 的 Hero 副标题由模板文案改为「CS 在读，白天写代码，晚上在这间妙妙屋里记点思考、作品和日常。」。
- `npm run build` 已验证通过。

### 2026-09-08 更新：首页 Hero 亲笔签名落款
- 新增 `public/signature.png`：由站长手写签名原图（`C:\Users\75123\Desktop\个人照片\0338384c3d8b1f6550a6de05ed2220f5.png`，黑底白字草书）处理而来——以灰度亮度作 alpha 通道去除黑底、仅保留白色笔迹，并做孤立噪点（连通域面积过滤）与边缘毛刺（3x3 开运算）清理；输出 547x261 透明背景 PNG。
- Home.jsx：Hero 标题下方、副标题上方新增 `<img class="hero-signature" src="/signature.png" alt="YangFan 手写签名">`，作亲笔落款。
- index.css：新增 `.hero-signature`（宽 200px / 最大 62%、保持等比、`opacity: 0.85` 半透明、轻阴影），与白色 Hero 文字体系协调。
- `npm run build` 已验证通过，产物含 `dist/signature.png`。

### 2026-09-08 更新：首页签名落款显示修复（对比度/空白问题）
- 首版处理存在缺陷：alpha 映射失误导致白色笔迹几乎全透明，页面签名区域空白、无对比度。
- 重新处理签名图：以灰度亮度直接映射 alpha（黑底透明、白字保留，阈值 10），4 邻域连通域面积过滤（<12px）清除孤立杂点，输出干净透明背景白字 PNG；经视觉复核笔迹清晰完整、无杂点。
- index.css：`.hero-signature` 由 `opacity: 0.85` + 纯深色阴影，调整为 `opacity: 1` + 白色光晕与深色投影双重 `drop-shadow`，提升在 Hero 背景上的对比度与辨识度。
- `npm run build` 已验证通过，产物含更新后的 `dist/signature.png`。

### 2026-09-08 更新：签名笔迹改为黑色（适配浅色背景）
- 实测确认 Hero 背景在浏览器中呈现偏亮的青绿色调，白色笔迹对比度不足导致签名不可见；按站长要求改为黑色笔迹。
- `public/signature.png` 重新生成：笔迹颜色由白色改为近黑墨色（RGB 15,15,15），alpha 映射与杂点过滤逻辑不变，输出透明背景黑字 PNG。
- index.css：`.hero-signature` 阴影由白色光晕+深色投影改为纯白色光晕双层 `drop-shadow`（白边托底，黑字在背景较深处也能看清轮廓）。
- 浅色背景预览验证：黑色笔迹与青绿背景对比清晰、无杂点。
- `npm run build` 已验证通过。

### 2026-09-08 更新：签名落款已移除（回退）
- 站长评估后决定不使用手写签名落款；已完整回退：
  - Home.jsx：移除 `<img class="hero-signature">`，Hero 区恢复为标题 + 副标题结构；
  - index.css：移除 `.hero-signature` 样式规则；
  - `public/signature.png` 已删除。
- `npm run build` 已验证通过。

### 2026-09-08 更新：Hero 标题英文名改用飘逸字体（Great Vibes → Dancing Script）
- 站长要求标题「YangFan」换更飘逸的字体。初版选用开源手写花体 **Great Vibes**，视觉过花、字号 1.45em 偏大；站长反馈后改为 **Dancing Script**（SIL OFL 许可草书体，可读性更好），并调小字号。
- 字体资源：`public/fonts/DancingScript.woff2`（25KB，700 weight，完整 latin 字形子集，由 Google Fonts 按 latin unicode-range 获取）。旧字体 `GreatVibes.woff2` 已删除。
- index.css：`@font-face` 改为 `font-family: "Dancing Script"`、`font-weight: 700`；`.hero-name` 字号由 1.45em 调为 **1.15em**（与中文标题接近、不过度放大）。
- Home.jsx：`<h1>` 中 "YangFan" 包为 `<span className="hero-name">`，中文部分样式不变。
- 构建已验证通过，浏览器实测：YangFan 渲染为倾斜连笔的飘逸草书，字号与中文协调。
- **踩坑补充**：Google Fonts `text=` 子集化接口返回的字形子集体积极小，但需核验其确实包含目标大写字母（如 Y 的 U+0059）等全部字形，否则浏览器会局部回退；稳妥做法是直接按 unicode-range 下载完整 latin 子集（25KB 亦很轻量）。

### 2026-09-08 更新：首页视觉重设计（编辑日志风 / 手账感）
- **目标与边界**：站长要求重设计首页但不动整体站点风格。方案：只改首页 Hero 与首页正文区块的视觉表达；所有新样式使用 `.home-*` / `.hero-*` 专属类，**不触碰其他页面共用的类**（`.card` / `.post-item` / `.project-card` / `.grid` / `.btn` 全局规则保留），深色模式与既有设计令牌继续生效。
- **Hero 区**：
  - 遮罩由浅蓝改**墨绿对角渐变**（148deg，深墨绿压暗青绿插画），营造"深夜房间"氛围；底部新增渐隐过渡，插画不再硬切。
  - 标题中文改用**楷体栈**（Kaiti SC / STKaiti / KaiTi / 楷体 → serif），字号 `clamp(2.4rem, 5.2vw, 3.5rem)`；`.hero-name`（Dancing Script）字号保持 **1.15em** 与中文协调，颜色改奶油色 `#ffe9b3` 作点缀。
  - 布局由全居中改为**桌面左文案右头像的不对称网格**（`.hero-inner`），移动端（≤760px）单列、头像置顶居中。
  - 头像外新增两层装饰环：虚线"邮票环" + 细描边环；hover 时头像轻微上浮。头像不再使用 `margin: 0 auto` 圆形渐变底写法。
  - Hero 按钮：主按钮改奶油实色 + 墨绿字、描边按钮白线，均圆角 14px，hover 上浮。
- **首页正文区块**（`.home-content`）：
  - 「最新文章 / 精选项目」区块标题改用 `.home-section-*`：编号（01/02）+ 标题，右侧"全部文章/项目 →"箭头 hover 右移。
  - 最新文章：卡片列表改为**虚线分隔的条目行**（日期 | 标题+tag+摘要 | ↗），hover 整行右移 + 底色微亮 + 标题变 accent。
  - 精选项目：卡片改为**两列色块入口**（编号 01/02 + emoji 色块 + 标题/描述 + ↗），hover 上浮 + accent 描边；≤900px 单列。原项目卡片无链接，现整卡可点跳转 `/projects`。
- 文章/项目行的标题字号权重用 650 级（接近 600 的中粗观感）；excerpt 长文本做两行截断（`-webkit-line-clamp`）。
- **可访问性与动效**：行/卡片均保留 focus 可达（整行 `<Link>`）；`prefers-reduced-motion: reduce` 下关闭位移动效。
- 验证：`npm run build` 通过；浏览器桌面 1440px / 移动 390px 双视口整页截图复核，无重叠、无溢出、配色与层级正常。
- 截图存档（临时，不在站点内）：桌面 `home-desktop.png`、移动 `home-mobile.png`。

### 2026-09-08 更新：Hero 名字由英文 YangFan 改为中文"杨帆"
- 站长要求名字用中文。全站 YangFan 文案统一替换：
  - `src/pages/Home.jsx`：Hero 标题 `<span class="hero-name">YangFan</span>` → `杨帆`；
  - `index.html`：meta description "YangFan 的个人网站" → "杨帆的个人网站"。
- 样式适配：`.hero-name` 不再使用 Dancing Script 草书（无中文字形），字体栈改为楷体栈（Kaiti SC / STKaiti / KaiTi / 楷体 → serif），`font-size` 由 1.15em 调 **1.06em**、`letter-spacing: 0.06em`、奶油色 `#ffe9b3` 保留作墨绿底上的暖色点缀。
- `public/fonts/DancingScript.woff2` **保留未删**：万一以后要英文签名风可随时换回；`index.css` 顶部 @font-face 注释已说明。
- 验证：`npm run build` 通过；浏览器桌面 1440px 首屏截图确认「杨帆」为奶油色楷体渲染、无黑体/宋体回退、与标题协调。
- 截图存档（临时）：`home-name-cn.png`。

### 2026-09-08 更新：Hero 标题字体怪感修复（楷体 → 系统黑体）
- 站长反馈"你好，我是杨帆"字体很怪。原因：楷体栈 + 600 合成字重在 Windows 上渲染偏细斜、笔锋与背景氛围违和，且名字单独放楷体+字距与标题观感脱节。
- 修复：`.hero h1` 中文字体改回**系统无衬线栈**（与 body 一致：-apple-system / PingFang SC / Microsoft YaHei），`font-weight: 800`，字号微调为 `clamp(2.2rem, 5vw, 3.2rem)`；`.hero-name` 不再单独指定字体与字号，改为继承 h1（`font-weight: inherit`），**仅保留奶油色 `#ffe9b3` 作暖色点缀**。
- 验证：`npm run build` 通过；桌面 1440px 首屏截图确认整行标题为统一黑体、无粗细/字形问题，「杨帆」奶油色区分自然，观感干净协调。

### 2026-09-08 更新：首页评价后微调（去硬感 / 过渡增强）
- 依站内评审结论微调三处，均为低风险视觉增益，未改字体体系、未引入重型 web 字体：
  - `.hero h1` 字重 `800 → 700`：微软雅黑 800 为合成超黑、视觉偏硬，700 为原生 Bold，中文渲染利落不发飘；
  - `.hero::after` 底部渐隐：高度 `clamp(48px,8vw,96px)` → `clamp(64px,10vw,128px)`，渐层改为 `var(--bg) 12% → transparent`，插画向页面背景过渡更柔和、消除硬切感；
  - `.hero-desc` 颜色 `rgba(255,255,255,0.9)` → `0.94`，遮罩上清晰度微提升。
- 未落地项：思源宋体/方正书宋标题字体（中文字体 woff2 体积 1MB+，违背站点轻量原则，暂缓）；头像虚线环 SVG 化与项目编号扩展（现阶段无收益，后续项目数>2 时再抽象）。
- 验证：`npm run build` 通过；桌面 1440px / 移动 390px 双视口截图复核：标题利落不发飘、底部过渡无硬切、副标题清晰、无布局错位。

### 2026-09-08 更新：本地写作台 /admin（在线编辑接口）
- 动机：站长希望直接在网页上写博客，不依赖第三方平台；纯静态站无法写文件，故在 **Vite dev 中间件**上挂一个零依赖本地编辑 API（`plugins/local-editor.js`，Node 原生 http/fs 实现，无新增 npm 依赖），网页端读写 `posts/*.md`，保存即触发 Vite 热更新，博客页即时生效。
- 新增：
  - `plugins/local-editor.js` —— dev-only API：`GET/POST /api/posts`、`GET/PUT/DELETE /api/posts/:slug`；slug 白名单防路径穿越；删除不进回收站而是移入 `posts/.trash/`（带时间戳，可手动找回）；校验重复 slug/非法 slug。
  - `src/pages/Admin.jsx` + `src/pages/Admin.css` —— 写作台：文章列表（标题/日期/标签/编辑/删除）、写新文章、编辑器（标题/slug/标签 + Markdown 正文 + 实时预览），样式独立成文件便于整体删除。
  - （后续优化 2026-09-08）表单只保留标题/slug/标签三字段，日期不再手填：新文章自动取当天、编辑保留原文日期；预览区挂 `.post-body` 类，与博客正式页共用同一套正文排版（已在 index.css 补齐 h1/h3/h4、列表、引用、链接、表格、hr、图片等通用排版），保证所见即所得。
  - （视觉修复 2026-09-08）顶部字段改为标题独占一行、slug/标签等宽分列（消除 2:1:1 失衡）；新文章不再预填默认标签"随笔"；左右栏等高 flex 布局、预览空态显示虚线占位提示而非大空白；底部操作区加大留白并垂直居中；浏览器复验截图确认修复生效，`npm run build` 通过。
  - （frontend-design 重构 2026-09-09）写作台整体升级为与首页同源的「手账工作台」设计语言，Admin.jsx/Admin.css 全量重写：纸面米白底 + 墨绿墨色局部变量（`.admin` 作用域，暗色 `[data-theme="dark"] .admin` 重定义，不污染全站令牌）；文章列表从原生 table 改为虚线上线的手账行（编号 01/02、标题悬停左移 + 纸面高亮、日期斜杠排版、slug 等宽字体、标签圆贴、空态纸条引导、加载骨架屏）；编辑器用"书脊线纸张面板"统一承载：标题独占行大字号下划线式输入、slug/标签等宽分列、左右等高栏（左等宽正文 + 实时字数、右预览纸复用 `.post-body`、空预览虚线占位带文案），保存主按钮墨绿底、返回/退出/删除等次级按钮齐全；按钮/输入/虚线全部补齐 hover/focus/disabled 态与 `prefers-reduced-motion` 适配；浏览器全场景实测（列表亮暗色、编辑器空态与 Markdown 实时预览亮暗色，共 6 张截图）无溢出无错乱，`npm run build` 通过。
  - （编辑器增强 2026-09-09）按用户截图诉求补齐两处：① 正文框上方新增**快捷格式工具栏**（.admin-toolbar）：B/I（选中包裹 ** *）、H1/H2/H3（行首插 #）、引用、行内代码、链接/图片语法插入、无序列表，以及右侧墨绿胶囊「↔ 编译预览」按钮——点击平滑滚动到预览区并高亮 1.5s，提示当前内容已编译渲染；插入基于光标/选区实现（wrapInline/lineMark，useRef + selectionRange），未选中文字时插入示例并选中方便替换。② 预览区改为**定格排版**：`.admin-preview-body` 内 h1-h4 全部 margin/padding 置零（仅字号 1.5/1.3/1.14/1rem + 字重/墨绿色区分层级），段落/列表/引用间距收紧为 0.45em，标题不再产生大段空白、多级标题观感一致紧凑；该规则仅作用于写作台预览，不动博客正式页 `.post-body` 全局排版。浏览器实测：工具栏插入 H1/H2/B 均生效、亮暗色多级标题间隙 11-17px 且 padding 为 0、编译按钮滚动+高亮时序正常（80ms 亮 → 1.6s 灭，smooth 滚动到位），`npm run build` 通过。
- 修改：`vite.config.js` 注册 `localEditor()`；`src/App.jsx` 增加 `/admin` 路由与页脚「写作」入口——**均用 `import.meta.env.DEV` 包裹，生产构建自动剔除**，上线后静态站点不存在写文件能力。
- 删除文章时 slug 不可改（编辑页禁用并提示）；slug 规则：英文/数字/下划线/短横线。
- 验证：API 冒烟全绿（列表/新建/重复 409/读取/修改/删除 404/非法 slug 400，中文 frontmatter 无乱码）；浏览器实测 /admin 列表渲染、编辑回填、预览、页脚入口均正常；`npm run build` 通过且产物不含 admin 代码。
- **彻底移除（上线想删干净时）**：删 `plugins/local-editor.js` + `vite.config.js` 中 `localEditor()` 注册 + `App.jsx` 的 `/admin` 路由与页脚入口 + `src/pages/Admin.jsx/.css`。

### 2026-09-09 更新：路由懒加载分包 + 帆船加载动画（SailLoader）
- **动机**：站名「肥仔妙妙屋」站长名「杨帆」，取「扬帆」谐音做页面加载动画；同时把四个非首页路由拆包，首屏更轻。
- **素材**：站长自 Storyset 导出动态插画（划桨帆船向右航行、纯白背景、浅米白帆/浪、深色线条、金黄船身），原文件 500x500 / 145 帧 / 40ms。落位：
  - `public/sailing.gif` —— 原件（回退用）；
  - `public/sailing.webp` —— 用 PIL 转 400px、隔帧抽帧（73 帧 / 80ms），体积 **2187KB → 663KB（省约 70%）**，`<picture>` 优先加载。
- **组件**：`src/components/SailLoader.jsx` + `SailLoader.css`，默认导出 `SailLoader({ text = "正在扬帆…" })`；结构为 `div.sail-loader[role=status][aria-live=polite]` → `picture`(webp 源 + gif 回退) + `p.sail-loader-text`。样式：白底圆角卡片（`border-radius:18px`）托底消除纯白底与页面的硬切、浅/深双模阴影、文字呼吸动画、`prefers-reduced-motion` 适配。
- **接入**：`src/App.jsx` 的 `Suspense fallback={<SailLoader />}`；四个路由均 `lazy()` 包装，并经 `withMinDelay(load, 420)` 保证动画至少展示 420ms（避免一闪而过）。`index.css` 中原临时占位样式 `.sail-fallback` 已删除。
- **验收结论（浏览器实测，2026-09-10）**：
  - 浅色/深色两态渲染正常（浅 `#f6f2e7` / 深 `#131b18` 底，配色与设计令牌一致），文案与帆船清晰可见；
  - **冷加载/刷新**懒加载路由（/blog、/projects、/about）时动画正常出现；
  - **站内点击导航切路由时动画不出现**：URL 已变、旧页面内容保持一段时间后直接切到新页，`Suspense` fallback 全程不渲染。
- **踩坑记录（重要）**：react-router-dom 7 的导航状态更新在 **React 19 下走 transition**，lazy 组件在过渡中挂起时 React **保留旧界面、不渲染 Suspense fallback**。故「lazy + Suspense」方案只能覆盖冷启动，无法覆盖站内路由切换。补法见下节。
- 验证：`npm run build` 通过（40 modules，dist 含各页独立 chunk 与 `sailing.gif` / `sailing.webp`）。

### 2026-09-10 更新：站内跳转也能看到帆船动画（补齐 Suspense 缺口）
- **做法**：不依赖 Suspense fallback，改为自行接管。`App.jsx` 新增 `useRouteLoader(ms)`：以 `location.key` 为基准，state 里存「已揭幕的 key」，两者不一致即视为"已跳转、未揭幕"，此时渲染整屏遮罩 `.route-loader-overlay`（内嵌 `<SailLoader />`），并由定时器在 `ROUTE_LOADER_MS` 后把揭幕 key 同步为当前 key。
  - 用 `revealedKey` 对比而不是 `prevPathname` ref，是为了避开 `main.jsx` 的 `StrictMode` 双跑副作用（首屏不触发，仅真实跳转触发）。
  - `ROUTE_LOADER_MS = 1500`（`App.jsx` 顶部常量）——**想多看一会儿/想更快，直接改这一个数**。
- **样式**：`SailLoader.css` 新增 `.route-loader-overlay`（`position: fixed; inset: 0; z-index: 60; background: var(--bg)`，`place-items: center` 居中；180ms 淡入；`prefers-reduced-motion` 关闭动画）。用 `var(--bg)` 纯色遮罩，浅/深色自动适配且盖住旧页面。
- **实测时间线**（Edge，前台）：点击 → +490ms 遮罩插入（旧页面先保留，这是 transition 提交延迟）→ 遮罩不透明铺满 → **+2021ms 移除并揭幕新页面**，实际展示 **1531ms**，与常量一致；/projects、/blog 两条跳转均通过。
- **已知小瑕疵**：点击后到遮罩出现有约 0.5s 空档（旧页面仍显示），来自 React transition 的提交延迟。若要"点下去立刻出动画"，需在导航 `Link` 的 `onClick` 里抢先置 loading，尚未实施。
- 验证：`npm run build` 通过。

### 2026-09-11 更新：关于我页重新设计（frontend-design）
- **动机**：关于页仍是模板期的「日记页 + 技能胶囊」结构，与首页的编辑日志风不同源；同时把占位 GitHub 链接换成真实账号 `https://github.com/51hexiao`。
- **设计概念**：一张摊开的**个人档案纸**——右上角贴「档案 · 001」奶油小签；纸内为「档案头（头像 + 姓名 + 一句话定位）→ 自述 → 最近在做」；右栏用一条虚线书脊与主列分开（不套卡片，避免卡片套卡片），只放编号技能清单与一张微倾的奶油联系方式便签。
- **结构（`src/pages/About.jsx` 全量重写）**：
  - 数据抽成三组常量：`skills`（8 项）、`doing`（最近在做 3 条）、`contacts`（GitHub `51hexiao` + 邮箱，`external` 决定是否新窗口打开）。
  - 类名体系：`.about-sheet`（纸面）/ `.about-tab`（档案标签）/ `.about-grid`（主列 + 288px 右栏）/ `.about-id`（头像名片）/ `.about-sec`（编辑式分节）/ `.about-doing-list`（编号贴纸 + 虚线条目）/ `.about-rail`（虚线书脊）/ `.about-skills`（编号清单）/ `.about-sticky` + `.about-links`（奶油便签与链接行）。
  - 文案按本站事实重写：杨帆 /「肥仔」/ 妙妙屋取自「扬帆」、CS 在读、多智能体与个性化学习路径推荐专利、本站建设、踩坑笔记；未提供的信息不臆造。
- **样式（`src/index.css`）**：
  - 清理模板期死代码：删除旧 `.about-grid / .about-text / .about-side / .skill-list / .contact-list` 规则块。
  - 新增关于页样式段（带设计概念注释），全部取设计令牌，不写死颜色，7 套主题 + 深浅自动适配；奶油底文字在 `[data-mode="dark"]` 下统一为深墨 `#131b18`，实测暗色便签底 `#c9a04c` 对比度约 7:1。
  - 保留手账细节：首字下沉（收敛到 `.about-lead p:first-child::first-letter`）、头像虚线外框、编号奶油贴纸、微倾便签；补齐 `:hover / :focus-visible` 与 `prefers-reduced-motion`。
  - 响应式：≤900px 右栏落到主列下方（书脊改横向分界、技能转两列）；≤640px 头像缩至 88px、首字下沉收小。
- **验证**：`npm run build` 通过（About 独立 chunk 4.46 kB）；Edge headless + CDP 截图 3 张（浅色/深色桌面 1440、手机 390）均无横向溢出与截断，头像与便签显示正常。

> 注：本节描述的「个人档案纸」实现已废弃——用户认为它与首页编辑日志风冲突，当日改为「编号区块 + 开放容器」的编辑日志风（见下节）。

### 2026-09-11 更新：关于我页细节打磨（frontend-design 二次优化）
- **结构（`src/pages/About.jsx`）**：`.page-head`（共享页头）→ `.about-id` 名片 → 01 这间妙妙屋 → 02 最近在做 → 03 技能；三个区块复用首页 `.home-section-head / .home-section-title / .home-section-no` 编号语言，页面不套整页纸张。
- **名片**：改为 grid 三列（头像 / 文本 / 收尾竖线）。头像做「双层纸片」——底层 `--accent-soft` 色块错位 7px 垫底，上层图片 14px 圆角 + 1px `--border` 描边 + `--shadow` 投影，去掉旧虚线外框；昵称由来行加 `—` 前缀；桌面端右侧一条 `--accent → transparent` 渐变竖线（顶端墨点），≤640px 隐藏。
- **01 这间妙妙屋**：首段按引言处理（1.06rem / 行高 1.88），其余段落 0.97rem，段落宽度收敛到 `66ch`，首字下沉保留。
- **02 最近在做**：条目标记由短横改为**空心方框 + 中心墨点**（"进行中"语义），hover 时方框描边转 `--accent`、垫 `--accent-soft`，墨点变实，整条右移 4px。
- **03 技能**：胶囊改 10px 圆角手账标签，hover 用 `--accent-soft` 底色替代换边框，`min-height` 40px（≤640px 提到 44px 满足触控目标）。
- **动效**：整页 5 个直接子元素按 0.05s 步进淡入上浮（0.52s / `cubic-bezier(.22, 1, .36, 1)`），规则整体包在 `prefers-reduced-motion: no-preference` 内，减弱动效偏好下自动不播放。
- **令牌纪律**：不写死颜色，只用 `--accent / --accent-soft / --border / --shadow / --chip / --text-secondary`，7 套主题各令牌定义齐备。
- **验证**：`npm run build` 通过；Edge headless 截图 1440 / 390 无横向溢出、无错位裁切。
- **二轮细节**：区块标题右侧补淡色引导虚线（`repeating-linear-gradient` 5px / 11px 节奏），把标题与内容连成"目录线"；首字下沉改为奶油高亮字块（`--cream` 底 + 微旋转 -1.2°，`[data-mode="dark"]` 内字色取 `--bg` 保对比）；02 hover 时条目标题转 `--accent`；技能标签前加 4px 墨点（hover 点亮）；页尾补三枚渐隐墨点收笔；区块间距微调为 `clamp(40px, 5vw, 58px)`。
- **验证（二轮）**：`npm run build` 通过；Edge headless 1440 / 390 复测，首字字块 / 引导虚线 / 技能墨点 / 页尾墨点均正常渲染，无溢出与裁切。

### 2026-09-11 更新：关于我页整页质感收口（frontend-design 三轮）
- **动机**：二轮后单个区块已够干净，但整页仍偏"白墙"，缺少把页面托成一张纸的底子；名片区信息密度高却没有视觉锚点；三段自述收尾略突兀；交互只有 hover 位移，缺按下反馈。
- **整页底纹**：`.page-about::before` 铺 24px 节奏的极淡点阵（`radial-gradient(var(--border) 1px, transparent 1.1px)`，`opacity: .55`），底部用 `mask-image` 线性渐隐（76% 起淡出）让纸纹在页尾自然收束；容器加 `isolation: isolate` 保证伪元素压在内容之下。
- **姓名锚点**：`.about-name::after` 在名字下方压一道奶油笔触（`--cream` 底，高 0.32em，微旋转 -0.6°）；深色主题改用 `--accent-soft` 并提不透明度，避免奶油偏暗后失去对比。
- **段末落款**：01 三段自述末尾补右对齐署名「—— 杨帆，写于妙妙屋」（0.85rem / `letter-spacing .08em` / `--text-secondary`），给正文一个收笔。
- **微交互**：02 方框 hover 时轻转 -8°、中心墨点放大 1.35 倍（`transform` 已入 transition）；03 标签 hover 时前置墨点放大 1.4 倍，并新增 `:active` 回压 `scale(.97)` 提供按下实感。
- **令牌纪律**：新增样式仍只用 `--border / --cream / --accent / --accent-soft / --text-secondary`，无写死颜色；动效仍包在 `prefers-reduced-motion` 策略内。
- **验证（三轮）**：`npm run build` 通过（40 modules / 323ms）；Edge headless 复测 1440 浅色 / 1440 深色 / 390 移动端三张，计算样式校验点阵底纹、姓名笔触（浅 `rgb(255,233,179)` / 深 `rgba(143,216,182,.1)`）、落款文案、方框与标签 transition 均生效，无溢出与裁切。

### 2026-09-11 更新：关于我页宽屏页边装置（frontend-design 四轮）
- **动机**：桌面大屏下内容最大宽 1100px，两侧各留约 170px 空白，页面像一张孤零零贴在白墙上的纸，页边空荡、缺"手账装订"的收束感。
- **页边竖线 + 刻度**：`.page-about::after`（`@media (min-width: 1280px)`，fixed 居中，`min(1156px, 100vw - 40px)`）叠四层背景——左右两条 1px 竖线（`--border`，上下各 5% 渐隐）+ 内侧每 132px 一枚 6px 短横刻度（`background-repeat: repeat-y`），整体 `opacity: .72`，随视口固定，像手账页边的尺。
- **竖排书签**：左右各一枚 `.about-edge`（`--left` / `--right`，`left/right: max(16px, calc(50vw - 690px))`），`writing-mode: vertical-rl`，左侧「关于我 · ABOUT」、右侧「肥仔妙妙屋 · MIAOMIAOWU」，顶端由 `::before` 压一枚 5px 墨点（`--accent`），`opacity: .7`。
- **小屏收起**：`@media (max-width: 1279.98px)` 下 `.about-edge { display: none }`，避免无留白视口把书签文字挤成正文裸文本。
- **入场动画兼容**：仅 `.page-about > *:not(.about-edge)` 播 `about-rise`；延迟选择器由 `:nth-child(n)` 改为 `.page-head / .about-id / section.section:nth-of-type(n)` 语义选择，既不因新增两枚装饰 span 错位，也避免动画的 `opacity: 1` 覆盖书签的 .7。
- **验证（四轮）**：`npm run build` 通过；Edge headless 计算样式校验：1440 下左右书签 fixed 于 x=30 / x=1391、`vertical-rl` 生效，`::after` 宽 1156px，`scrollWidth == 1440` 无横向溢出；390 下两枚书签 `display: none`、`::after content: none`，无裸文本残留；截图 v7_about_light / dark / mobile 三张通过。

### 2026-09-12 更新：探索（足迹）模块上线（补记此前遗漏的整体记录）
- **定位**：「朋友圈式足迹册」——高德地图上按时间顺序把有定位的记录连成路线，序号即「第几站」；无定位的记录也能以图文卡片形式收录。
- **内容层** `src/utils/explore.js`：与 `post.js` 同构，`import.meta.glob("../../explore/*.md", { query: "?raw" })` 构建期读入；frontmatter 支持 `title/slug/date/type(food|spot)/place/lat/lng/cover/images`；`trail` 按时间正序编号 `no`，`records` 倒序给卡流；导出 `counts/years/TYPE_LABEL`。
- **页面**：`Explore.jsx`（列表：筛选 chips + 图例 + 地图 + 记录流卡流）、`ExplorePost.jsx`（详情：徽章 + 进度 + 正文 + 整线地图 + 前后翻页）、`ExploreWrite.jsx`（DEV 写作台：朋友圈式表单，图片 ≤9 张、Ctrl+V 粘贴、>3MB 自动压缩到 2000px/JPEG 0.86）。
- **地图组件** `TrailMap.jsx`：自定义 HTML 序号图钉（吃饭琥珀/景点墨绿，anchor bottom-center）、虚线路线 Polyline（带方向）、自定义 InfoWindow、跟随 `data-mode` 切换底图（whitesmoke/darkblue）与连线颜色；三态降级遮罩（loading / no-key / error），未配 key 时记录流照常可用。
- **定位选择器** `LocationPicker.jsx`：搜索联想 + 点图逆地理回填，写作台共用。
- **后端**：`local-editor.js` 扩展 `/api/explore` 系列 CRUD（slug 校验/409/软删除进 `explore/.trash/`）与 `/api/uploads`（dataURL → `public/uploads/`，单图 ≤8MB）。
- **配置**：`.env.local` 的 `VITE_AMAP_KEY` / `VITE_AMAP_SECURITY`（**注意：VITE_ 前缀变量会打进生产 bundle，公开部署前必须在高德控制台配域名白名单**）。
- 路由 `/explore`、`/explore/:slug`、`/explore/write`（DEV）挂载于 `App.jsx`。
- **上线隔离补强（2026-09-13）**：`Admin` 与 `ExploreWrite` 两个 lazy import 也包进了 `import.meta.env.DEV`（`DEV ? lazy(...) : null`），生产构建彻底不含写作台代码（dist 资产 13 → 11 个文件），叠加原有的路由 DEV 门控、页面自我降级、后端仅 dev 中间件三层，写作能力只存在于本地 dev。

### 2026-09-12 更新：写作台定位选择器重构（联想下拉 / 类型自动匹配 / 定位按钮）
- **删除「地点名称」手填框**：地点名只来自搜索选中项或地图点选的逆地理，不再手动维护。
- **自绘联想下拉**：不再用 AMap.AutoComplete 绑 input 的自带下拉（样式与层级不可控），改为 `auto.search()` + debounce 250ms 自绘 `.loc-sugs` 列表；点击列表项 → `map.setZoomAndCenter(16)` → 该位置即这条记录的坐标，地名（名称 · 区域）一并回填。
- **类型自动匹配**：选中 POI 后用 `PlaceSearch.getDetails(tip.id)` 查详情，`typecode` 以 05 开头（餐饮服务）或名称命中餐饮关键词 → 自动切到「吃饭」，否则「景点」；**用户手动点过分段器后不再自动覆盖**（`typeTouched` ref，编辑旧记录时也视为已手选）。
- **定位按钮** `.loc-locate`：地图右下角 ⌖ 圆钮，`AMap.Geolocation`（返回 GCJ-02 坐标，无需自行纠偏）→ 中心飞过去 + 逆地理回填；失败时在定位条上方显示提示。AMAP_PLUGINS 相应追加 `AMap.Geolocation`。
- **重要踩坑：`.env.local` 的 `VITE_AMAP_SECURITY` 为空时，地图瓦片正常显示但所有服务类接口（AutoComplete / PlaceSearch / Geocoder）一律返回 error 且无提示**——此前站长「吃饭」记录只有坐标没有地名就是这个原因。已在前端把失败原因显式提示出来。安全密钥已由站长提供并配置（2026-09-12），换新 key 后需同步更新 key + jscode 一对。
- **重要踩坑：AMap.LngLat 取坐标必须调用 `getLng()`/`getLat()`**，`loc.getLng ?? loc.lng` 的写法对真实 LngLat 取到的是函数本身，传给地图变 `LngLat(NaN, NaN)` 抛 `Invalid Object`——旧版联想选中从未生效的根因。现在统一按「有 getLng 就调用、否则读 lng」处理并加了 `Number.isFinite` 防线（LocationPicker 的 pick 与 locate 两处）。
- **验收（密钥配置后浏览器实测）**：lint 0 警告、build 通过；搜「知味观」出联想 → 选中湖滨总店 → 地图飞行 + 当前定位显示「知味观(湖滨总店) · 浙江省杭州市上城区」+ 坐标 120.16359, 30.25263 + 类型自动「吃饭」；搜「雷峰塔」选中后类型自动切「景点」。手填框已删、⌖ 定位按钮就位。

### 2026-09-12 更新：图钉图标可配置（手动选择 + 按地点类型自动匹配）
- **需求**：图钉从纯序号圆点升级为「emoji 图标 + 右下角小序号」；发布时可手动选图标，不选则按选中地点的 POI 类型自动配预设。
- **图标预设** 新文件 `src/utils/exploreIcons.js`：10 个预设（🍜吃饭 / ☕咖啡 / 🍻小酒馆 / 🍰甜品 / 🏞️风光 / 🏛️古迹 / 🌉地标 / 🛍️逛街 / ⛺露营 / 🚶漫步）+ `typeEmoji()` 类型兜底 + `matchIcon(poi)`（typecode 05 餐饮内先分咖啡/酒馆/甜品再落🍜；游览按古迹/露营/购物/地标/风光关键词）+ `iconEmoji(record)`（icon 字段 > 类型兜底）。
- **数据层**：`explore/*.md` frontmatter 新增 `icon` 字段（存 emoji 字符串，≤8 字符），`explore.js` 与 `local-editor.js` 的读/写均已支持；旧记录无 icon 字段自动走类型兜底，无需迁移。
- **写作台**：「图钉图标」chips 行（自动 + 10 预设）；「自动」= 不指定（选点时自动匹配上的值也会即时显示为选中）；手动点过任一 emoji 后 `iconTouched` 置位，之后换地点不再覆盖；保存时 icon 为空则按类型兜底写入。
- **渲染**：TrailMap 图钉 `.trail-pin`（34px）内为 emoji，右下角 `.trail-pin-no` 小序号牌（surface 底白描边）；InfoWindow 标题行加图标；列表卡类型徽章前也带 emoji；地图提示文案同步更新。
- **验收**：lint 0 警告、build 通过；实测 11 枚 chips 渲染、星巴克自动 ☕ + 类型吃饭、手动选 🍜 后换岳麓山——类型自动切「景点」而图标保持手动值。

### 2026-09-13 更新：详情页正文排版升级
- 站长反馈详情页正文「字小、简陋」，与九宫格大图不协调。`.ex-detail-body` 由 15.5px 升至 16.5px、行高 2.05、字距 0.012em，限宽 800px 保证中文行长度舒适；段间距 1.1em，正文内图片加圆角。
- 首段奶油首字下沉（与关于页 `about-lead` 同一手法：cream 字块 + rotate(-1.2deg)，暗色下字色取 --bg 保对比）。
- 验收：lint 0 警告、build 通过；实测计算样式 16.5px / 33.8px / 800px 生效，截图确认「我」字奶油块渲染正常。
- 追加（同日）：应用户要求把九宫格图片从正文上方移到正文下方（`ExplorePost.jsx` 顺序调整），`.ex-detail-body + .ex-grid` 加 24px 间距。

### 2026-09-13 更新：地图工具条 + 旅程报告弹层（含海报导出）
- **地图工具条**（`TrailMap.jsx`，地图右上角一列手账圆钮，列表/详情地图通用）：⌖ 回到当前位置（AMap.Geolocation，失败时地图顶部提示条说明）；⛶ 回到全览（setFitView）；⛵ 跟随帆船（rAF 每帧 setCenter 对准巡航小船，单站/减弱动效时置灰）；╱ 航线开关（Polyline show/hide，重建时按 showLineRef 恢复可见性）。按钮可用态在 effect 收尾用 queueMicrotask 刷新，规避 oxlint set-state-in-effect。
- **旅程报告弹层** 新组件 `TrailReport.jsx/.css`：入口为工具条右侧「📓 旅程报告」（`.ex-report-entry`，margin-left auto）。全屏遮罩 + 720px 册页卡（Esc/点遮罩关闭，body 滚动锁）。内容：头版大数字（站/城/公里/跨越天数/照片，奶油划线）+ 脚步分布（城市排行虚线条）+ 出行节奏（按月 CSS 柱状）+ 口味比例（双段条）+ 本程之最（最远一跳 pathKm 逐对计算、间隔最久 gapDays）+ 落款。单站记录自动隐藏「之最」。
- **海报导出**：`drawPoster()` 用原生 canvas 绘 1080×1620 手账海报（米白纸面、双层边框、奶油划线大数字、城市排行、口味条、落款+日期），`toDataURL` 下载 PNG，纯前端零依赖、无跨域污染。
- **顺带修复**：`cityOf()` 对无分隔符的地址（地图点选逆地理常见）按「剥省/自治区 → 取到市/州/盟」提取城市，报告与统计的城市维度不再是一整串地址；「出行动节奏」错别字修正。
- 验收：lint 0 警告、build 通过；实测四钮渲染与置灰逻辑、航线开关切换、报告数据（1 站/1 城/长沙市/100% 吃饭）、海报绘制无异常、Esc 关闭与滚动解锁。

### 2026-09-13 更新：详情页布局美化（双栏 + 手账右栏）
- **桌面双栏** `.ex-detail-layout`：主列（正文 + 相册 + 落款）+ 272px 右栏；右栏 `position: sticky` 跟随滚动。
- **右栏两张手账卡**：①「INFO · 这一站」——大图标 + NO.x/N 站 + 日期 + 地点 + 坐标；②「TRAIL · 本程」——整条轨迹目录（序号 + 标题省略号 + 图标），当前站奶油荧光笔划线高亮，点击直达；列表 max-height 滚动。
- **相册贴纸化**：`.ex-detail-grid` 九宫格每张按 3n 序列微旋转（-0.9°/0.7°/-0.4°）+ 投影，hover 摆正微放大。
- **段末落款**：「—— 杨帆，写于妙妙屋」右对齐（与关于页 `about-sign` 同手法）；地图小节加「MAP · 这一站的位置」kicker；前后翻页 pager 标题带图标 emoji。
- **响应式**：≤980px 单栏，右栏横排并入正文下方，站点信息卡隐藏（头部信息重复）；≤720px 沿用原窄屏规则。
- **踩坑**：flex 子项卡片默认 `min-width: auto`，窄屏被 nowrap 的目录标题撑出横向滚动（scrollWidth 406 > 390），`.ex-rail-card` 补 `min-width: 0` 后恢复 375。
- 验收：lint 0 警告、build 通过；1440 双栏与 390 单栏截图检查通过，无横向溢出。

### 2026-09-13 更新：记录流多图卡片改紧凑缩略条
- 问题：9 图的长文记录在记录流里撑出上千像素的巨卡（九宫格每格 326px 见方），与其他记录的紧凑票根风格脱节；摘要截断本身正常（-webkit-line-clamp 3 行生效）。
- 修复：列表卡图片改 `.ex-grid-strip` 缩略条——固定 3 列 112px 高、最多显示 3 张，超出的在第三张上叠「+N」角标；点缩略图仍开灯箱看全部。详情页大九宫格不受影响。
- 验收：卡片高度 305px（原 1000px+），`scrollWidth` 无溢出；截图确认与相邻卡片风格一致。
- 再迭代（应用户要求）：缩略条方案取消，改为**封面图淡化铺整张票面当背景纸**——`.ex-ticket-bg` 绝对定位层读 `--ex-cover`（第一张图即封面），亮色 0.16 / 暗色 0.12 不透明度叠在纸面上；摘要改为**单行省略**（nowrap + ellipsis，保留右上 78px 邮戳避让）；`.ex-card-link` 抬 z-index 保证内容在背景层之上；删除 strip/+N 样式。卡片高度 128px，与其他记录一致。

### 2026-09-12 更新：探索模块「旅程纪念册」高级化
- **数据层新增**（`explore.js`，纯函数无新依赖）：`cityOf()`（「杭州 · 河坊街」→「杭州」）、`pathKm()/totalKm`（haversine 累计相邻站点直线距离）、`photoCount`、`cityCount`、`gapDays()`（相邻两站间隔天数）。
- **列表页**：
  - 统计条 `.ex-stats`：4 站 / 1 座城市 / N 公里足迹 / N 张照片，数字 rAF 滚动动画（`useCountUp`，`prefers-reduced-motion` 下直接显示终值），数字带奶油荧光笔划线；
  - 卡片改「车票/票根」风 `.ex-ticket`：左侧竖排票根（编号 + 类型章，chip 底 + 虚线撕边 + 上下打孔缺口圆）、右上微旋转邮戳圆章（日期 + NO.，颜色跟类型，正文/head 右侧留 78px 避让）、`is-flash` 定位高亮态；≤640px 票根收起、邮戳缩小；
  - 相邻记录日期差 ≥1 天时插入「间隔 N 天」虚线贴纸；年份多于一个时插入年份分隔（单年份不出噪音）；
  - 卡片 stagger 入场（`animation-fill-mode: backwards`，避免锁死 hover 位移），delay 封顶 14 格。
- **地图联动**（`TrailMap.jsx`）：卡片 hover / pin 点击 → `map.panTo()` 平滑飞行（已在视野内不动）；pin 点击 → 列表对应卡片 `scrollIntoView` 居中 + `is-flash` 高亮 1.9s；左上角「N 站 · 全程 ≈ N km」里程牌；`AMap.MoveAnimation` 驱动 ⛵ 小帆船沿航线循环巡航（减弱动效偏好下不上船）。
- **灯箱** 新组件 `Lightbox.jsx/.css`：全站可复用，←/→ 切换、Esc 关闭、点遮罩关、body 滚动锁、N/M 计数；接入列表卡片九宫格（点图 `preventDefault` 不跳详情）与详情页九宫格。
- **详情页**：有封面时头部改「明信片」（21/9 大图 + 右上邮戳贴纸，≤640px 转 16/10）；前后翻页 pager 显示「N 天前 / N 天后」旅程间隔。
- **踩坑记录（重要）**：
  1. **高德 2.0 自定义 HTML marker 的点击事件不可靠**：`marker.on("click")` 在自定义 content 下不触发（疑似高德未给自定义 HTML 转发事件）；给 content 传真实 DOM 并手动绑 listener 也不行（高德克隆节点）。**可靠做法：在地图容器上挂捕获阶段（capture: true）的 click 事件委托**，按 `.trail-pin` 的 DOM 序号反查点集——高德会在自家冒泡监听里 stopPropagation，只有捕获阶段能先拿到真实点击。
  2. **`AMap.MoveAnimation` 不能靠 URL plugin 参数注册**（脚本能加载但 `window.AMap.MoveAnimation` 为 undefined），必须 `AMap.plugin("AMap.MoveAnimation", cb)` 动态加载。
  3. 数字滚动动画若在 effect 里 setState 触发 oxlint `set-state-in-effect`，改为 reduced-motion 时渲染期直接返回终值。
  4. 站内 html 若有 smooth scroll-behavior，`scrollIntoView`/`scrollTo` 后立刻读 `scrollY` 会读到动画起点，自动化验收时用 `behavior: "instant"`。
- **验收**：`npm run lint` 0 警告、`npm run build` 通过；浏览器实测（1440/390、亮/暗）：统计数字动画、车票卡片、间隔贴纸、地图联动（hover 点亮 + pin 点击滚动定位 + 弹窗）、帆船巡航、灯箱键盘操作、明信片头图、pager「27 天前」均通过；测试用临时记录已删入回收站。
- 示例数据：`explore/` 现有 4 篇（雷峰塔/楼外楼/西湖断桥/站长新记），曾误删的 `hefangjie` 在 `explore/.trash/` 可手动移回。

### 2026-09-13 更新：新增「私藏」收藏/推荐模块
- **定位**：收藏册/安利页——书影音、好物工具、网站友链，访客了解站主口味的窗口。
- **数据层** 新文件 `src/data/collections.js`（与 projects.js 同型，改文件即生效）：字段 `type(book|movie|music|stuff|site)` / `title` / `creator` / `note`（一句推荐语）/ `url`（选填，有则整卡外链）/ `rating`（1~5 星选填）/ `emoji`（选填图标）。内置 4 条示例，替换即可。
- **页面** `src/pages/Collections.jsx + Collections.css`，路由 `/collections`，导航名「私藏」（探索与作品集之间）：分类 chips（全部/书/影/音/物/站，只列有数据的类型）+ 藏书票卡片网格（图标 + 类型徽章 + 星级 + 标题 + 作者 + 3 行截断推荐语 + 折角装饰；有 url 整卡外链新窗口）+ 空态。卡片 stagger 入场、hover 上浮折角、reduced-motion 适配，样式全走设计令牌。
- 验收：lint 0 警告、build 通过；实测导航/筛选/卡片/外链正常。**踩坑提示**：后台标签页的 CSS 动画会被浏览器节流冻结在第一帧，自动化截图会拍到 opacity 0 的空白页——前台用户无感知，勿误判为渲染 bug。

### 2026-09-13 更新：系统功能扩展（六件套）
- **⌘K 命令面板** 新组件 `CommandPalette.jsx/.css`：Ctrl/⌘+K 或「/」（非输入框内）或导航 ⌕ 按钮唤起；搜索索引=静态页面+博客+足迹+私藏（全部构建期数据，零请求）；↑↓/Enter/Esc 键盘操作，选中项 clamp 用渲染期派生（selIdx）规避 set-state-in-effect。z-index 120。
- **博客归档页** `/archive`（`Archive.jsx/.css`）：按年份分组的时间线（虚线书脊 + 墨点节点 + hover 高亮）+ 标签筛选带计数；入口在博客页副标题「按年份翻归档 →」。
- **分享海报** `src/utils/sharePoster.js`：canvas 绘 1080×1440 手账分享图（双层框 + 奶油划线标题自动换行 4 行 + 摘要 6 行 + 信息行 + 落款）；博客详情（文章头部）与探索详情（meta 行）各有「📸 生成分享图」按钮，点击直接下载 PNG。
- **页脚手账信息条**：开张天数（建站日 2026-09-08）+ 全站字数（博客+足迹正文去标签累计）+ 足迹笔数，随时间自动增长。
- **同城胶囊**：探索详情页城市（`cityOf` 提取）存在同城记录时显示「📍 长沙市 · 同城还有 N 站 →」，点击跳 `/explore?city=城市`，列表页读取 query 显示筛选胶囊（可 × 清除）。
- **RSS + sitemap** 新插件 `plugins/site-meta.js`（vite.config 改为函数式传入 mode）：build 收尾生成 `dist/rss.xml`（博客+足迹合并，最近 30 条）与 `dist/sitemap.xml`（7 个静态路由 + 全部 slug）；站点地址读 `.env` 的 `SITE_URL`（未配置用占位域名并提示，`.env.local` 已留注释位）。
- 验收：lint 0 警告、build 通过；实测面板打开/搜索「橘子」命中/Enter 跳转/Esc、同城胶囊→筛选→×清除、分享图绘制无异常、归档空态、页脚统计（6 天/655 字/1 笔）、rss+sitemap 生成（1 条/8 址）。临时测试记录已删。

### 2026-09-14 更新：系统功能扩展第二批（八件套）
- **动态标题 + SEO**：新 hook `src/utils/usePageTitle.js`（title + og:title/og:description 动态更新），九个页面全部接入；`index.html` 补 og:site_name/og:type 基础标签。
- **正文增强组件** `PostBody.jsx`：博客/探索详情统一使用——正文图片点击开灯箱、代码块自动包「语言标签 + 复制按钮」工具条（clipboard API + execCommand 兜底）、外链自动新窗口；配套 `.post-code` 样式。
- **阅读进度条** `ReadProgress.jsx`：详情页顶部 3px 渐变条，rAF 节流监听滚动。
- **草稿双保险**：① 文件名 `*.draft.md`（post.js/explore.js 用「正集 glob + 排除负 pattern + dev 专用草稿 glob」双 glob，生产构建连内容一起剔除——**运行时过滤不够，raw 内容会留在 bundle**）；② frontmatter `draft: true`（仅生产列表隐藏）。dev 下博客列表显示虚线「草稿」徽章。
- **数据备份**：`/api/backup`（local-editor.js）把 posts/ + explore/ 全部 md 拼成带路径注释的单文件下载；两个写作台头部各有「⬇ 备份全部」按钮。
- **首页聚合流**：首页 01 区块由「最新文章」升级为「最近动态」——博客 + 足迹 + 私藏（有 date 字段的）按日期倒序混排 6 条；collections 数据结构加可选 `date` 字段。
- **路线按城分段**：TrailMap 连线重构为 `linesRef` 数组——同城段主色虚线，跨城段灰暗色弱化细线，跨城长线不再喧宾夺主；航线开关作用于全部线段。
- **报告年份切换**：TrailReport 顶部「全部 / N 年度」tab（多年份才显示），buildReport 参数化为传入列表；大数字/城市/口味全部按年份重算。
- **重要踩坑**：① TrailReport 重构时删了 `useState` import 但组件仍使用——渲染抛 ReferenceError 导致**整个 React 应用卸载（root 空、无窗口错误事件）**，现象是全站按钮点击无响应+页面空白，且因 dev 服务器依赖缓存 504（Outdated Optimize Dep）混在一起排查了很久；解法是 index.html 临时注入 window error 捕获脚本写 localStorage。教训：**重构 import 后必须跑一遍实际交互**；dev 服务器 504 时先清 `node_modules/.vite` 重启。
- 验收：lint 0 警告、build 通过；实测九页标题、草稿徽章与生产剔除（grep dist 无草稿内容）、备份下载、首页混排、报告年份切换（全部 3 站/258 天 ↔ 2025 年度 1 站）、进度条。测试数据已清理。

### 2026-09-14 更新：GitHub Pages 上线（https://51hexiao.github.io/yangfan-site/）
- **部署方式（站长自建）**：公开仓库 yangfan-site + GitHub Actions（push main → npm ci → build → deploy-pages）；`main.jsx` 改 **HashRouter**（SPA 在 GH Pages 无 404 转发时的标准解）；`vite.config.js` 构建时 `base: '/yangfan-site/'`。git 三提交：init → 配置部署 → 修复 HashRouter 导入白屏。
- **线上验收发现并修复三件事**：① Actions 读不到 gitignore 的 `.env.local`，地图「待通电」——新建**随仓库提交的 `.env`**（SITE_URL + 高德 key/jscode；key 本就会打进公开 bundle，入公开仓库无额外暴露，建议高德控制台配域名白名单防盗用）；② rss/sitemap 是占位域名且路径为 `/blog/x`（HashRouter 下不可达）——site-meta.js 改为输出 `site/#/path` 格式，SITE_URL 写入 .env 后 Actions 构建自动正确；③ Explore.jsx 漏接 usePageTitle（此前批量脚本中途报错被跳过，「九页全接」系误报）——已补，验收要靠线上实测。
- 本地 `npm run build` 复核：rss 链接 `https://51hexiao.github.io/yangfan-site/#/blog/ni`、sitemap 9 地址、高德 key 进 chunk、lint 0 警告。
- **已推送部署并线上复验（commit 1645700）**：地图出图钉（key 进 chunk Explore-DRgQi3hC.js）、标题「探索 · 足迹 · 肥仔妙妙屋」、rss/sitemap 为 yangfan-site/#/ 真实地址、工具条 4 钮正常。排查技巧：① GitHub Pages 的 HTML/JS 有 ~10 分钟 CDN 缓存，验证新部署用「内容寻址的新 chunk 文件名是否 200」最可靠（HTML 引用可能还是缓存的旧哈希）；② 无 gh CLI 且 API 限流时，可用 `git credential fill` 取凭据调 Actions API 查 run 状态。
- 上线前清单剩余：高德控制台给 key 配域名白名单（51hexiao.github.io）。

### 2026-09-15 更新：小管家模块（AI 站内助手 + 版本手账）
- **版本手账** `plugins/git-desk.js`（322 行，零依赖）+ `/admin/git`（`AdminGit.jsx/.css`）：写作台的 Git 面板——读取分支/远程/领先落后/最近一版与变更清单（porcelain -z 解析，正确处理重命名条目，conflicted 单独分组提示手动解决），支持「提交一版」「推送」「提交并推送」。**安全设计**：execFile+参数数组防注入、动作白名单（无 reset/checkout/force）、写操作互斥、GIT_TERMINAL_PROMPT=0、首推自动 -u、错误人性化映射；彻底移除步骤写在文件头注释。与 local-editor 一样仅 dev 存在，生产不打包。
- **AI 小管家** `SiteAssistant.jsx/.css`（659 行）：全站常驻悬浮助手（右侧留白书签/窄屏圆钮），BYOK 直连 DeepSeek/OpenAI/通义/Moonshot（key 只存浏览器 localStorage，仓库与产物无密钥）；站内上下文注入 + 动作指令白名单（仅导航/换主题/搜索，禁止编造内容）；80 字手账批注口吻。**已 DEV 门控**（与写作台同待遇，生产不打包）。
- **节奏调优**：路由过场 ROUTE_LOADER_MS 1500→380、withMinDelay 420→180——高频写作场景速度优先，帆船仪式感仅在冷加载可见。
- **收尾三改进（本次评审落地）**：① `.gitignore` 排除 `posts/.trash/`、`explore/.trash/`（add -A 不再把"已删除"文件复活进历史），并 `git rm --cached` 解除已跟踪的 21 个 trash 文件；② SiteAssistant 改 lazy + Suspense 包裹并 DEV 门控（实测 dist 无 mmw 代码）；③ 对话历史存 sessionStorage（刷新不丢、关页即清，上限 40 条，头部加「⌫ 清空对话」）。
- 顺带：`main.jsx` 为 HashRouter（GH Pages 无 404 转发的标准解），dev 访问管理页须用 `/#/admin`、`/#/admin/git` 形式。
- 验收：lint 0 警告、build 通过（dist 无 AdminGit/SiteAssistant 代码）；实测版本手账（分支/远程/43 处变更清单渲染）、小管家打开/未配置提示/历史 sessionStorage 持久化（刷新恢复）/清空。

## 六、路线图

### 第 1 步：Markdown 内容层（✅ 已完成，2026-09-08）
- 新建 `posts/` 目录，文章用 `*.md` 文件存储，格式：YAML frontmatter（title/date/tag/slug）+ 正文 Markdown。
- 构建时解析（推荐用 `gray-matter` + 简单 md 渲染，或 Vite 的 `import.meta.glob`）。
- 将现有 3 篇示例迁移为 md 文件。
- **写作体验目标：改 md 文件即更新，无需碰任何 JS。**

### 第 2 步：上线（未开始）
- 部署到 Vercel / Netlify / GitHub Pages（纯静态免费托管）。
- 绑定个人域名。git push 即发布。
- 上线前补：真实个人信息、网站标题、`sitemap.xml`、更完整的 SEO meta。

### 第 3 步：后端与在线后台（远期，视需求启动）
- **触发条件**：需要在线编辑发布、评论、点赞、用户系统等动态能力时。
- 初步选型倾向：Node.js (Express 或 Hono) + SQLite（轻量、单文件、易备份）。
- 功能范围：登录（仅站长账号）、Markdown 在线编辑器、文章增删改查 API。
- **安全红线**：权限校验必须在服务端做，前端隐藏入口不是真正的防护。
- 迁移路径：第 1 步的 md 文件可脚本化导入数据库，前端仅把数据来源从构建时换成 API，改动面小。

### 其他候选事项（不定期）
- [ ] 个人真实头像 / 照片
- [ ] 文章归档页（按年份）、标签页
- [ ] 站内搜索
- [ ] 访问统计（上线后）
- [ ] RSS 订阅

## 七、架构决策记录（ADR）

| 日期 | 决策 | 理由 |
|---|---|---|
| 2026-09-08 | 采用纯静态方案起步，不提前建后端 | 现阶段无动态需求；静态托管零成本零运维；后端可随时按第 3 步补上 |
| 2026-09-08 | 内容层最终形态为 Markdown 文件而非 JS 对象 | 纯文本可迁移、可版本控制、写作体验好；任何工具/AI 都能直接读写 |
| 2026-09-08 | 样式用原生 CSS + 设计令牌，不用框架 | 站点规模小，依赖越少越可持续；变量体系已支持主题切换 |
| 2026-09-08 | Markdown 解析用 glob + marked，不引入 gray-matter / 完整静态博客框架 | frontmatter 仅需 4 个字段，自写 20 行解析足够；减少依赖面 |

## 八、给接手者（人或 AI）的提示

1. 动手前先读完本文档；改完代码必须回写「当前进度」。
2. 所有 UI 文案为中文；代码注释风格与现有文件保持一致。
3. 修改样式时优先使用 `index.css` 顶部的设计令牌（`--accent` 等），不要写死颜色值，否则深色模式会破。
4. 数据文件（posts.js / projects.js）是临时形态，重构为 md 时注意 `utils/post.js` 的阅读时长逻辑要保留。
5. 不要引入新的重型依赖；每个新依赖先说明理由。
