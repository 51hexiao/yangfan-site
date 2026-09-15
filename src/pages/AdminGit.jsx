import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Admin.css";
import "./AdminGit.css";

// 变更分组：顺序即展示顺序
const GROUPS = [
  { key: "added", label: "新增", mark: "+", cls: "add" },
  { key: "modified", label: "修改", mark: "~", cls: "mod" },
  { key: "deleted", label: "删除", mark: "−", cls: "del" },
  { key: "untracked", label: "未跟踪", mark: "?", cls: "new" },
  { key: "conflicted", label: "冲突（需要先手动解决）", mark: "!", cls: "bad" },
  { key: "other", label: "其他", mark: "·", cls: "new" },
];

const STATUS_TEXT = {
  A: "新增",
  M: "修改",
  D: "删除",
  R: "重命名",
  C: "复制",
  T: "类型变更",
  U: "冲突",
};

const statusText = (entry) => {
  if (entry.x === "?") return "未跟踪";
  const code = entry.x !== " " ? entry.x : entry.y;
  return STATUS_TEXT[code] ?? "有改动";
};

export default function AdminGit() {
  const [status, setStatus] = useState(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/git/status");
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "读取失败");
      setStatus(data);
      setFailed(false);
    } catch {
      setStatus(null);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 初始读取接口并亮 loading，属合理的 mount 同步
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const runGit = async (kind) => {
    const text = message.trim();
    if (kind !== "push" && !text) {
      setNote({ type: "error", text: "先写一句提交信息，方便日后回看" });
      return;
    }
    if (kind === "commit-push") {
      const ok = window.confirm(
        "提交并推送到 GitHub？\n提交先存在本地，随后推送远程；推送成功后线上站点会自动重新部署。",
      );
      if (!ok) return;
    }
    if (kind === "push") {
      const ok = window.confirm("把本地这些版本推到 GitHub？\n推送成功后线上站点会自动重新部署。");
      if (!ok) return;
    }

    setBusy(kind);
    setNote(null);
    try {
      const isPush = kind === "push";
      const r = await fetch(isPush ? "/api/git/push" : "/api/git/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isPush ? {} : { message: text, push: kind === "commit-push" }),
      });
      const data = await r.json();
      if (!r.ok) {
        setNote({ type: "error", text: data.error ?? "操作失败" });
      } else if (isPush) {
        setNote({ type: "ok", text: "已推送到远程，线上稍后自动更新" });
      } else if (data.pushed) {
        setNote({ type: "ok", text: `已提交 ${data.hash} 并推送 · ${data.summary}` });
      } else if (data.pushError) {
        setNote({ type: "error", text: `已提交 ${data.hash}，但推送失败：${data.pushError}` });
      } else {
        setNote({ type: "ok", text: `已提交 ${data.hash} · ${data.summary}` });
      }
      if (!isPush) setMessage("");
      await load();
    } catch {
      setNote({ type: "error", text: "请求失败：本地 dev 服务还在吗？" });
    } finally {
      setBusy("");
    }
  };

  // —— 接口不可用 / 加载中 ——
  if (loading && !status) {
    return (
      <div className="container admin">
        <div className="admin-head">
          <div className="admin-skeleton-line" />
          <div className="admin-skeleton-btn" />
        </div>
        <div className="admin-skeleton-list">
          {[0, 1, 2].map((i) => (
            <div key={i} className="admin-skeleton-row">
              <span className="admin-skeleton-line w-40" />
              <span className="admin-skeleton-line w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="container admin">
        <div className="git-wrap">
          <div className="admin-note">
            <span className="admin-note-no">01</span>
            <h2>版本接口只在本地开着</h2>
            <p>读取仓库、提交、推送都需要本地 dev 服务写文件与跑 git 的能力，静态站点没有这一层。</p>
            <p className="admin-hint">本地开发时运行 npm run dev，再访问 /admin/git 即可使用。</p>
            <Link to="/admin" className="admin-link">
              ← 返回写作台
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status && !status.isRepo) {
    return (
      <div className="container admin">
        <div className="git-wrap">
          <div className="admin-note">
            <span className="admin-note-no">02</span>
            <h2>这里还不是 Git 仓库</h2>
            <p>当前工作目录没有 .git，先在终端 git init 并配置远程仓库再来。</p>
            {status.reason && <p className="admin-hint">git 说：{status.reason}</p>}
            <Link to="/admin" className="admin-link">
              ← 返回写作台
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const changes = status.changes;
  const total = status.total;
  const pendingPush = status.hasUpstream && status.ahead > 0;
  const working = Boolean(busy);

  return (
    <div className="container admin">
      <div className="git-wrap">
        <div className="admin-head">
          <Link to="/admin" className="admin-btn admin-btn-text">
            ← 返回写作台
          </Link>
          <button className="admin-btn" onClick={load} disabled={loading || working}>
            {loading ? "读取中…" : "↻ 刷新状态"}
          </button>
        </div>

        <header>
          <span className="admin-kicker">VERSION DESK</span>
          <h1 className="admin-list-h1">版本手账</h1>
          <p className="admin-list-sub">
            {status.branch}
            {status.detached ? "（游离 HEAD）" : ""} · 改完在这一页把今天存进 Git
          </p>
        </header>

        {note && <div className={`admin-msg admin-msg-${note.type}`}>{note.text}</div>}

        {/* —— 仓库状态 —— */}
        <section className="git-hero" aria-label="仓库状态">
          <div className="git-grid">
            <div className="git-cell">
              <span className="git-cell-label">当前分支</span>
              <span className="git-cell-value">
                <span className="git-chip">{status.branch}</span>
              </span>
            </div>
            <div className="git-cell">
              <span className="git-cell-label">远程仓库</span>
              <span className="git-cell-value git-mono git-dim" title={status.remote || "未配置 remote"}>
                {status.remote || "未配置 remote"}
              </span>
            </div>
            <div className="git-cell">
              <span className="git-cell-label">与远程的差距</span>
              <span className="git-cell-value">
                {status.hasUpstream ? (
                  status.ahead === 0 && status.behind === 0 ? (
                    <span className="git-dim">与 {status.upstream} 同步</span>
                  ) : (
                    <>
                      {status.ahead > 0 && <span className="git-pill git-pill-ahead">待推送 {status.ahead}</span>}
                      {status.behind > 0 && <span className="git-pill git-pill-behind">落后 {status.behind}</span>}
                    </>
                  )
                ) : (
                  <span className="git-dim">这个分支还没有 upstream</span>
                )}
              </span>
            </div>
            <div className="git-cell">
              <span className="git-cell-label">最近一版</span>
              <span className="git-cell-value">
                {status.lastCommit ? (
                  <>
                    <span className="git-mono">{status.lastCommit.hash}</span>
                    <span className="git-dim"> · {status.lastCommit.summary}</span>
                    <span className="git-dim"> · {status.lastCommit.when}</span>
                  </>
                ) : (
                  <span className="git-dim">还没有任何提交</span>
                )}
              </span>
            </div>
          </div>
        </section>

        {/* —— 变更清单 —— */}
        <div className="git-section-head">
          <span className="git-section-title">变更清单</span>
          <span className="git-section-note">
            {status.clean ? "工作区干净" : `共 ${total} 处改动 · 提交时会全部写入这一版`}
          </span>
        </div>

        {status.clean ? (
          <div className="git-empty">
            <span className="git-empty-title">纸上没有新墨迹</span>
            <span className="git-empty-desc">工作区与上一版一模一样。写下点什么，再回来存一版。</span>
          </div>
        ) : (
          GROUPS.map((group) => {
            const list = changes[group.key] ?? [];
            if (!list.length) return null;
            return (
              <div className="git-group" key={group.key}>
                <div className="git-group-head">
                  <span className={`git-mark git-mark-${group.cls}`}>{group.mark}</span>
                  <span>{group.label}</span>
                  <span className="git-group-count">{list.length}</span>
                </div>
                <ul className="git-files">
                  {list.map((entry, idx) => (
                    <li className="git-file" key={`${group.key}-${entry.file}-${idx}`}>
                      <span className="git-path" title={entry.file}>
                        {entry.file}
                      </span>
                      <span className="git-file-side">
                        {entry.staged && <span className="git-staged">已暂存</span>}
                        <span className="git-file-state">{statusText(entry)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}

        {/* —— 提交区 —— */}
        <section className="git-commit" aria-label="提交">
          <label className="git-commit-field" htmlFor="git-message">
            <span className="git-commit-label">这一版改了什么</span>
            <textarea
              id="git-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="例如：补一篇西湖断桥的足迹，顺手调了下首页留白"
              spellCheck={false}
              disabled={working}
            />
          </label>
          <div className="git-actions">
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => runGit("commit")}
              disabled={working || status.clean}
            >
              {busy === "commit" ? "提交中…" : "提交这一版"}
            </button>
            <button
              className="admin-btn"
              onClick={() => runGit("commit-push")}
              disabled={working || status.clean}
            >
              {busy === "commit-push" ? "提交并推送中…" : "提交并推送"}
            </button>
            {pendingPush && (
              <button className="admin-btn" onClick={() => runGit("push")} disabled={working}>
                {busy === "push" ? "推送中…" : `↑ 推送 ${status.ahead} 个待推送版本`}
              </button>
            )}
            <span className="git-count">{message.trim().length}/200</span>
          </div>
          <p className="admin-hint">
            提交 = 把上面全部改动存成一条本地记录；推送 = 同步到 GitHub（线上站点会自动重新部署）。提交信息会整理成一行。
          </p>
        </section>

        <p className="admin-footnote">
          版本接口仅在本地 dev 模式生效（npm run dev）；上线后的静态站点此页自动降级为提示，不具备读写仓库的能力。
        </p>
      </div>
    </div>
  );
}
