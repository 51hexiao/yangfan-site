// 本地开发专用的博客在线编辑 API（零依赖，Node 原生实现）
//
// 仅 vite dev 生效：作为 Vite dev server 中间件挂在 /api 下，
// 网页端直接读写 posts/*.md，保存后 Vite 热更新即刻在博客页生效。
// 生产构建（vite build）产物为纯静态，不含本插件，接口天然不可用，
// 访问 /admin 也会得到"仅本地开发可用"的引导提示。
//
// 彻底移除（后期上线时若想删干净）：
//   1. 删除本文件
//   2. 删除 vite.config.js 中的 localEditor() 注册
//   3. 删除 src/App.jsx 中 /admin 路由与写作入口
//   4. 删除 src/pages/Admin.jsx / Admin.css
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, "posts");
const TRASH_DIR = path.join(POSTS_DIR, ".trash");
const EXPLORE_DIR = path.join(ROOT, "explore");
const EXPLORE_TRASH_DIR = path.join(EXPLORE_DIR, ".trash");
const SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
const MAX_BODY_BYTES = 1024 * 1024;
const UPLOADS_DIR = path.join(ROOT, "public", "uploads");
const MAX_UPLOAD_RAW_BYTES = 24 * 1024 * 1024; // base64 JSON 的读取上限
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;        // 解码后的单图上限
const EXT_BY_MIME = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

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

function readPost(filename) {
  const raw = fs.readFileSync(path.join(POSTS_DIR, filename), "utf8");
  const { meta, body } = parseFrontmatter(raw);
  const slug = meta.slug ?? filename.replace(/\.md$/, "");
  return { slug, title: meta.title ?? "", date: meta.date ?? "", tag: meta.tag ?? "", content: body };
}

function listPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md") && fs.statSync(path.join(POSTS_DIR, f)).isFile())
    .map((f) => ({ filename: f, ...readPost(f) }));
}

function buildFile(slug, meta, content) {
  const lines = [
    "---",
    `title: ${String(meta.title ?? "").trim()}`,
    `slug: ${slug}`,
    `date: ${String(meta.date ?? "").trim()}`,
    `tag: ${String(meta.tag ?? "").trim()}`,
    "---",
    "",
    String(content ?? "").trimEnd(),
    "",
  ];
  return lines.join("\n");
}

async function readBody(req, maxBytes = MAX_BODY_BYTES) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) {
      const err = new Error("内容过大");
      err.status = 413;
      throw err;
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const err = new Error("请求体不是合法 JSON");
    err.status = 400;
    throw err;
  }
}

function cleanDate(value) {
  const s = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "";
}

// —————— 探索栏目（explore/*.md，吃饭 / 景点的朋友圈式记录） ——————

function parseImages(value) {
  const arr = Array.isArray(value) ? value : String(value ?? "").split(",");
  return arr.map((s) => String(s).trim()).filter(Boolean);
}

function cleanCoord(value, max) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const n = Number(raw);
  if (!Number.isFinite(n) || Math.abs(n) > max) return "";
  return String(Number(n.toFixed(6)));
}

function readExplore(filename) {
  const raw = fs.readFileSync(path.join(EXPLORE_DIR, filename), "utf8");
  const { meta, body } = parseFrontmatter(raw);
  const images = parseImages(meta.images);
  return {
    filename,
    slug: meta.slug ?? filename.replace(/\.md$/, ""),
    title: meta.title ?? "",
    date: meta.date ?? "",
    type: meta.type === "food" ? "food" : "spot",
    icon: String(meta.icon ?? "").trim(),
    place: meta.place ?? "",
    lat: meta.lat ?? "",
    lng: meta.lng ?? "",
    images,
    cover: meta.cover || images[0] || "",
    content: body.replace(/^\n+/, ""),
  };
}

function listExplore() {
  if (!fs.existsSync(EXPLORE_DIR)) return [];
  return fs
    .readdirSync(EXPLORE_DIR)
    .filter((f) => f.endsWith(".md") && fs.statSync(path.join(EXPLORE_DIR, f)).isFile())
    .map((f) => readExplore(f));
}

function buildExploreFile(slug, data) {
  const date = cleanDate(data.date) || new Date().toISOString().slice(0, 10);
  const type = data.type === "food" ? "food" : "spot";
  const place = String(data.place ?? "").trim().replace(/\s*\n\s*/g, " ");
  const images = parseImages(data.images);
  const title =
    String(data.title ?? "").trim().replace(/\s*\n\s*/g, " ") || place || (type === "food" ? "吃饭" : "景点");
  const cover = String(data.cover ?? "").trim() || images[0] || "";
  // 图钉图标：手动选的 emoji 原样存，没配就存空串（渲染时按类型兜底）
  const icon = String(data.icon ?? "").trim().slice(0, 8);
  return [
    "---",
    `title: ${title}`,
    `slug: ${slug}`,
    `date: ${date}`,
    `type: ${type}`,
    `icon: ${icon}`,
    `place: ${place}`,
    `lat: ${cleanCoord(data.lat, 90)}`,
    `lng: ${cleanCoord(data.lng, 180)}`,
    `cover: ${cover}`,
    `images: ${images.join(", ")}`,
    "---",
    "",
    String(data.content ?? "").trim(),
    "",
  ].join("\n");
}

export default function localEditor() {
  return {
    name: "local-editor-api",
    configureServer(server) {
      server.middlewares.use("/api", async (req, res, next) => {
        const method = req.method;
        const url = new URL(req.url, "http://localhost");
        const segments = url.pathname.split("/").filter(Boolean); // ['posts'] 或 ['posts', slug]

        // 统一错误出口
        const guard = (fn) =>
          Promise.resolve()
            .then(fn)
            .catch((err) => {
              if (err.status === 413) send(res, 413, { error: "内容过大" });
              else if (err.code === "ENOENT") send(res, 404, { error: "内容不存在" });
              else send(res, err.status ?? 500, { error: err.message ?? "服务器错误" });
            });

        // —— 图片上传：接收 dataURL，写入 public/uploads/，返回静态 URL ——
        if (segments[0] === "uploads") {
          if (segments.length > 1) return send(res, 404, { error: "路径不存在" });
          if (method !== "POST") {
            res.statusCode = 405;
            res.setHeader("Allow", "POST");
            return send(res, 405, { error: "仅支持 POST" });
          }
          return guard(async () => {
            const body = await readBody(req, MAX_UPLOAD_RAW_BYTES);
            const dataUrl = String(body.dataUrl ?? "");
            const m = /^data:(image\/(?:png|jpeg|webp|gif));base64,([\s\S]+)$/.exec(dataUrl);
            if (!m) throw Object.assign(new Error("不支持的图片格式（支持 png/jpeg/webp/gif）"), { status: 400 });
            const buf = Buffer.from(m[2].replace(/\s+/g, ""), "base64");
            if (!buf.length) throw Object.assign(new Error("图片内容为空"), { status: 400 });
            if (buf.length > MAX_IMAGE_BYTES) {
              throw Object.assign(new Error("图片超过 8MB，请压缩后再粘贴"), { status: 413 });
            }
            fs.mkdirSync(UPLOADS_DIR, { recursive: true });
            const name = `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${EXT_BY_MIME[m[1]]}`;
            fs.writeFileSync(path.join(UPLOADS_DIR, name), buf);
            return send(res, 201, { ok: true, url: `/uploads/${name}` });
          });
        }

        // —— 备份：把 posts/ 与 explore/ 的全部 Markdown 打包成一个 md 下载 ——
        if (segments[0] === "backup" && method === "GET") {
          return guard(() => {
            const dumpDir = (dir, label) => {
              if (!fs.existsSync(dir)) return "";
              return fs
                .readdirSync(dir)
                .filter((f) => f.endsWith(".md"))
                .sort()
                .map((f) => `\n\n<!-- ==== ${label}/${f} ==== -->\n\n` + fs.readFileSync(path.join(dir, f), "utf8").trim())
                .join("");
            };
            const content =
              `# 肥仔妙妙屋 · 内容备份\n\n> 生成时间：${new Date().toLocaleString("zh-CN")}\n` +
              `> 恢复方法：按注释里的路径把各段内容存回 posts/ 与 explore/ 目录即可。\n` +
              dumpDir(POSTS_DIR, "posts") +
              dumpDir(EXPLORE_DIR, "explore") +
              "\n";
            const stamp = new Date().toISOString().slice(0, 10);
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/markdown; charset=utf-8");
            res.setHeader("Content-Disposition", `attachment; filename="miaomiaowu-backup-${stamp}.md"`);
            res.end(content);
          });
        }

        // —— 探索栏目：/api/explore[/:slug] ——
        if (segments[0] === "explore") {
          if (segments.length > 2) return send(res, 404, { error: "路径不存在" });
          const eslug = segments[1];
          if (eslug && !SLUG_RE.test(eslug)) {
            return send(res, 400, { error: "slug 只能包含英文、数字、下划线与短横线" });
          }
          const efp = eslug ? path.join(EXPLORE_DIR, `${eslug}.md`) : null;

          if (method === "GET") {
            if (!eslug) return guard(() => send(res, 200, listExplore()));
            return guard(() => send(res, 200, readExplore(`${eslug}.md`)));
          }

          if (method === "POST") {
            return guard(async () => {
              const body = await readBody(req);
              const want = String(body.slug ?? "").trim();
              const date = cleanDate(body.date) || new Date().toISOString().slice(0, 10);
              const s = want || `${date}-${Math.random().toString(36).slice(2, 6)}`;
              if (!SLUG_RE.test(s)) throw Object.assign(new Error("slug 格式非法"), { status: 400 });
              fs.mkdirSync(EXPLORE_DIR, { recursive: true });
              const fp = path.join(EXPLORE_DIR, `${s}.md`);
              if (fs.existsSync(fp)) throw Object.assign(new Error("这一笔已经记过了"), { status: 409 });
              fs.writeFileSync(fp, buildExploreFile(s, body), "utf8");
              return send(res, 201, { ok: true, slug: s });
            });
          }

          if (method === "PUT") {
            return guard(async () => {
              const body = await readBody(req);
              if (!fs.existsSync(efp)) throw Object.assign(new Error("记录不存在"), { status: 404 });
              const old = readExplore(`${eslug}.md`);
              const want = String(body.slug ?? "").trim();
              const s = want && want !== eslug ? want : eslug;
              if (!SLUG_RE.test(s)) throw Object.assign(new Error("slug 格式非法"), { status: 400 });
              const newFp = path.join(EXPLORE_DIR, `${s}.md`);
              if (s !== eslug && fs.existsSync(newFp)) {
                throw Object.assign(new Error("这一笔已经记过了"), { status: 409 });
              }
              const merged = {
                ...old,
                ...body,
                date: cleanDate(body.date) || old.date,
              };
              fs.writeFileSync(newFp, buildExploreFile(s, merged), "utf8");
              if (s !== eslug) fs.unlinkSync(efp);
              return send(res, 200, { ok: true, slug: s });
            });
          }

          if (method === "DELETE") {
            return guard(() => {
              if (!fs.existsSync(efp)) throw Object.assign(new Error("记录不存在"), { status: 404 });
              fs.mkdirSync(EXPLORE_TRASH_DIR, { recursive: true });
              const stamp = new Date().toISOString().replace(/[:.]/g, "-");
              fs.renameSync(efp, path.join(EXPLORE_TRASH_DIR, `${stamp}-${eslug}.md`));
              return send(res, 200, { ok: true, movedTo: "explore/.trash" });
            });
          }

          res.statusCode = 405;
          res.setHeader("Allow", "GET, POST, PUT, DELETE");
          return send(res, 405, { error: "不支持的请求方法" });
        }

        // 仅处理 /posts[/:slug]，其余交给 Vite
        if (segments[0] !== "posts") return next();
        if (segments.length > 2) return send(res, 404, { error: "路径不存在" });

        const slug = segments[1];
        const filename = slug ? `${slug}.md` : null;

        if (slug && !SLUG_RE.test(slug)) {
          return send(res, 400, { error: "slug 只能包含英文、数字、下划线与短横线" });
        }

        if (method === "GET") {
          if (!slug) return guard(() => send(res, 200, listPosts()));
          return guard(() => {
            const p = readPost(filename);
            return send(res, 200, p);
          });
        }

        if (method === "POST") {
          return guard(async () => {
            const body = await readBody(req);
            const s = String(body.slug ?? "").trim();
            if (!SLUG_RE.test(s)) throw Object.assign(new Error("slug 格式非法"), { status: 400 });
            const fp = path.join(POSTS_DIR, `${s}.md`);
            if (fs.existsSync(fp)) throw Object.assign(new Error("slug 已存在，请换一个"), { status: 409 });
            const date = cleanDate(body.date) || new Date().toISOString().slice(0, 10);
            fs.writeFileSync(fp, buildFile(s, { title: body.title, date, tag: body.tag }, body.content), "utf8");
            return send(res, 201, { ok: true, slug: s });
          });
        }

        if (method === "PUT") {
          return guard(async () => {
            const body = await readBody(req);
            const oldFp = path.join(POSTS_DIR, filename);
            if (!fs.existsSync(oldFp)) throw Object.assign(new Error("文章不存在"), { status: 404 });
            const date = cleanDate(body.date) || readPost(filename).date || new Date().toISOString().slice(0, 10);
            const newSlugRaw = String(body.slug ?? "").trim();
            const newSlug = newSlugRaw && newSlugRaw !== slug ? newSlugRaw : slug;
            if (!SLUG_RE.test(newSlug)) throw Object.assign(new Error("slug 格式非法"), { status: 400 });
            const newFp = path.join(POSTS_DIR, `${newSlug}.md`);
            if (newSlug !== slug && fs.existsSync(newFp)) {
              throw Object.assign(new Error("slug 已存在，请换一个"), { status: 409 });
            }
            fs.writeFileSync(newFp, buildFile(newSlug, { title: body.title, date, tag: body.tag }, body.content), "utf8");
            if (newSlug !== slug) fs.unlinkSync(oldFp);
            return send(res, 200, { ok: true, slug: newSlug });
          });
        }

        if (method === "DELETE") {
          return guard(() => {
            const fp = path.join(POSTS_DIR, filename);
            if (!fs.existsSync(fp)) throw Object.assign(new Error("文章不存在"), { status: 404 });
            fs.mkdirSync(TRASH_DIR, { recursive: true });
            const stamp = new Date().toISOString().replace(/[:.]/g, "-");
            fs.renameSync(fp, path.join(TRASH_DIR, `${stamp}-${filename}`));
            return send(res, 200, { ok: true, movedTo: ".trash" });
          });
        }

        res.statusCode = 405;
        res.setHeader("Allow", "GET, POST, PUT, DELETE");
        send(res, 405, { error: "不支持的请求方法" });
      });
    },
  };
}
