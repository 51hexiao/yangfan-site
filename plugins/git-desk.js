// 本地开发专用的 Git 版本管理 API（零依赖，Node 原生实现）
//
// 仅 vite dev 生效：作为 Vite dev server 中间件挂在 /api/git 下，
// 供写作台的「版本手账」页（/admin/git）读取仓库状态、提交一版、推送到远程。
// 生产构建（vite build）产物为纯静态，不含本插件，这些接口天然不可用。
//
// 安全设计：
//   1. 全部走 execFile + 参数数组，不经过 shell，杜绝命令注入；
//   2. 动作白名单：只有 status / add -A / commit / push，不提供 reset、checkout、
//      clean、force push 等破坏性操作；远程名与分支名一律由本地仓库推导，
//      不接受前端传入；
//   3. 同时只允许一个写操作，避免并发 add/commit 争抢 index.lock；
//   4. GIT_TERMINAL_PROMPT=0，缺少凭据时立即报错而不是挂住 dev server。
//
// 彻底移除：
//   1. 删除本文件
//   2. 删除 vite.config.js 中的 gitDesk() 注册
//   3. 删除 src/pages/AdminGit.jsx / AdminGit.css，以及 App.jsx 中 /admin/git 路由与入口
import { execFile } from "node:child_process";

const ROOT = process.cwd();
const GIT_TIMEOUT_MS = 60 * 1000;
const MAX_MESSAGE_LEN = 200;
const MAX_OUTPUT_CHARS = 4000;

let busy = false; // 写操作互斥锁

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

function clip(text) {
  const s = String(text ?? "").trim();
  return s.length > MAX_OUTPUT_CHARS ? `${s.slice(0, MAX_OUTPUT_CHARS)}…` : s;
}

// 跑一条 git 子命令：数组参数，不经过 shell
function git(args, timeout = GIT_TIMEOUT_MS) {
  return new Promise((resolve) => {
    execFile(
      "git",
      args,
      {
        cwd: ROOT,
        timeout,
        windowsHide: true,
        maxBuffer: 8 * 1024 * 1024,
        env: {
          ...process.env,
          GIT_TERMINAL_PROMPT: "0",
          GIT_PAGER: "cat",
          GIT_OPTIONAL_LOCKS: "0",
        },
      },
      (err, stdout, stderr) => {
        resolve({
          ok: !err,
          stdout: String(stdout ?? ""),
          stderr: String(stderr ?? ""),
          message: err ? (err.killed ? "命令超时" : String(err.message ?? "")) : "",
        });
      },
    );
  });
}

function readJson(req, maxBytes = 64 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let done = false;
    req.on("data", (chunk) => {
      if (done) return;
      size += chunk.length;
      if (size > maxBytes) {
        done = true;
        reject(Object.assign(new Error("请求体过大"), { status: 413 }));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (done) return;
      done = true;
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        reject(Object.assign(new Error("请求体不是合法 JSON"), { status: 400 }));
      }
    });
    req.on("error", (err) => {
      if (done) return;
      done = true;
      reject(err);
    });
  });
}

// 提交信息：压成一行纯文本，去掉控制字符
function cleanMessage(value) {
  return String(value ?? "")
    .replace(/[\p{Cc}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// 解析 git status --porcelain=v1 -z（重命名 / 复制条目后跟一个"原路径"字段）
function parsePorcelain(raw) {
  const parts = raw.split("\0").filter((s) => s.length > 0);
  const entries = [];
  for (let i = 0; i < parts.length; i += 1) {
    const line = parts[i];
    if (line.length < 3) continue;
    const x = line[0];
    const y = line[1];
    let file = line.slice(3);
    if (x === "R" || x === "C") {
      const from = parts[i + 1] ?? "";
      if (from) i += 1;
      if (from) file = `${from} → ${file}`;
    }
    entries.push({ x, y, file, staged: x !== " " && x !== "?" });
  }
  return entries;
}

// 归入「新增 / 修改 / 删除 / 未跟踪 / 冲突 / 其他」六类之一
function groupOf(entry) {
  const { x, y } = entry;
  if (x === "?" || y === "?") return "untracked";
  if (x === "U" || y === "U" || (x === "A" && y === "A") || (x === "D" && y === "D")) return "conflicted";
  if (x === "D" || y === "D") return "deleted";
  if (x === "A") return "added";
  if (x === "R" || x === "C" || x === "M" || y === "M" || x === "T" || y === "T") return "modified";
  return "other";
}

function emptyChanges() {
  return { added: [], modified: [], deleted: [], untracked: [], conflicted: [], other: [] };
}

async function readStatus() {
  const inside = await git(["rev-parse", "--is-inside-work-tree"], 15000);
  if (!inside.ok || inside.stdout.trim() !== "true") {
    return { isRepo: false, reason: inside.ok ? "当前目录不是 Git 仓库" : clip(inside.stderr || inside.message) };
  }

  const [branchR, headR, statusR, remoteR, logR] = await Promise.all([
    git(["rev-parse", "--abbrev-ref", "HEAD"], 15000),
    git(["rev-parse", "--short", "HEAD"], 15000),
    git(["status", "--porcelain=v1", "-z", "--untracked-files=all"], 20000),
    git(["remote", "get-url", "origin"], 15000),
    git(["log", "-1", "--format=%h%x1f%s%x1f%cr"], 15000),
  ]);

  const branchRaw = branchR.stdout.trim();
  const detached = !branchRaw || branchRaw === "HEAD";
  const head = headR.stdout.trim();

  let upstream = "";
  let ahead = 0;
  let behind = 0;
  const upstreamR = await git(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"], 15000);
  if (upstreamR.ok && upstreamR.stdout.trim()) {
    upstream = upstreamR.stdout.trim();
    const countR = await git(["rev-list", "--left-right", "--count", "HEAD...@{upstream}"], 15000);
    if (countR.ok) {
      const [a, b] = countR.stdout.trim().split(/\s+/);
      ahead = Number(a) || 0;
      behind = Number(b) || 0;
    }
  }

  const entries = parsePorcelain(statusR.stdout);
  const changes = emptyChanges();
  for (const entry of entries) changes[groupOf(entry)].push(entry);
  for (const key of Object.keys(changes)) {
    changes[key].sort((a, b) => a.file.localeCompare(b.file));
  }

  let lastCommit = null;
  if (logR.ok && logR.stdout.trim()) {
    const [hash, summary, when] = logR.stdout.trim().split("\u001f");
    lastCommit = { hash: hash ?? "", summary: summary ?? "", when: when ?? "" };
  }

  return {
    isRepo: true,
    branch: detached ? head || "(未知)" : branchRaw,
    detached,
    head,
    upstream,
    hasUpstream: Boolean(upstream),
    ahead,
    behind,
    remote: remoteR.ok ? remoteR.stdout.trim() : "",
    lastCommit,
    changes,
    total: entries.length,
    clean: entries.length === 0,
  };
}

// 推送：首次推送没有 upstream 时，自动补 -u origin <当前分支>
async function doPush() {
  let r = await git(["push"]);
  if (!r.ok && /no upstream branch|has no upstream|no such remote|specify which branch/i.test(r.stderr)) {
    const brR = await git(["rev-parse", "--abbrev-ref", "HEAD"], 15000);
    const br = brR.stdout.trim();
    if (!br || br === "HEAD" || br.startsWith("-") || !/^[A-Za-z0-9._/-]+$/.test(br)) {
      return { ok: false, detail: "当前处于游离 HEAD 或分支名异常，无法自动推送，请回到分支后重试" };
    }
    r = await git(["push", "-u", "origin", br]);
  }
  if (r.ok) return { ok: true, detail: clip(r.stderr || r.stdout) };
  return { ok: false, detail: clip(r.stderr || r.message) };
}

async function runCommit(message, pushAfter) {
  const addR = await git(["add", "-A"]);
  if (!addR.ok) {
    return { status: 500, data: { error: `暂存失败：${clip(addR.stderr || addR.message)}` } };
  }

  const commitR = await git(["commit", "-m", message]);
  if (!commitR.ok) {
    const both = `${commitR.stdout}${commitR.stderr}`;
    if (/nothing to commit|nothing added to commit|无文件要提交/i.test(both)) {
      return { status: 400, data: { error: "没有可提交的改动（工作区是干净的）" } };
    }
    if (/Please tell me who you are|user\.email|user\.name/i.test(both)) {
      return { status: 500, data: { error: "Git 还没配身份：请先在终端执行 git config user.name / user.email" } };
    }
    if (/index\.lock/i.test(both)) {
      return { status: 500, data: { error: "index.lock 被占用（可能另一个 Git 进程正在跑），稍后重试" } };
    }
    return { status: 500, data: { error: `提交失败：${clip(commitR.stderr || commitR.message)}` } };
  }

  const [headR, summaryR] = await Promise.all([
    git(["rev-parse", "--short", "HEAD"], 15000),
    git(["log", "-1", "--format=%s"], 15000),
  ]);

  const result = {
    ok: true,
    hash: headR.stdout.trim(),
    summary: summaryR.stdout.trim(),
    pushed: false,
    pushError: "",
  };

  if (pushAfter) {
    const pushR = await doPush();
    result.pushed = pushR.ok;
    result.pushError = pushR.ok ? "" : pushR.detail;
  }
  return { status: 200, data: result };
}

export default function gitDesk() {
  return {
    name: "git-desk-api",
    configureServer(server) {
      server.middlewares.use("/api/git", async (req, res) => {
        const method = req.method;
        const url = new URL(req.url, "http://localhost");
        const action = url.pathname.split("/").filter(Boolean)[0] ?? "";

        try {
          if (method === "GET" && action === "status") {
            return send(res, 200, await readStatus());
          }

          if (method === "POST" && action === "push") {
            if (busy) return send(res, 429, { error: "有一个 Git 操作正在进行，请稍候" });
            busy = true;
            try {
              const out = await doPush();
              if (!out.ok) return send(res, 500, { error: `推送失败：${out.detail}` });
              return send(res, 200, { ok: true, pushed: true, detail: out.detail });
            } finally {
              busy = false;
            }
          }

          if (method === "POST" && action === "commit") {
            if (busy) return send(res, 429, { error: "有一个 Git 操作正在进行，请稍候" });
            const body = await readJson(req);
            const raw = String(body.message ?? "").trim();
            if (!raw) return send(res, 400, { error: "先写一句提交信息" });
            if (raw.length > MAX_MESSAGE_LEN) {
              return send(res, 400, { error: `提交信息最多 ${MAX_MESSAGE_LEN} 字` });
            }
            const message = cleanMessage(raw);
            if (!message) return send(res, 400, { error: "提交信息只有空白字符，写点实际的" });

            busy = true;
            try {
              const { status, data } = await runCommit(message, Boolean(body.push));
              return send(res, status, data);
            } finally {
              busy = false;
            }
          }

          if (!action) {
            return send(res, 200, {
              ok: true,
              endpoints: ["GET /api/git/status", "POST /api/git/commit", "POST /api/git/push"],
            });
          }
          return send(res, 404, { error: "路径不存在" });
        } catch (err) {
          return send(res, err.status ?? 500, { error: err.message ?? "服务器错误" });
        }
      });
    },
  };
}
