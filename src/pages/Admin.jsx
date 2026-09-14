import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { marked } from "marked";
import "./Admin.css";

const today = () => new Date().toISOString().slice(0, 10);
const prettyDate = (d) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${y} · ${m} · ${day}`;
};

function emptyDraft() {
  return { slug: "", title: "", date: today(), tag: "", content: "" };
}

export default function Admin() {
  const [apiOk, setApiOk] = useState(null); // null=检测中 true false
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(null); // null=列表, 或 {slug, filename}
  const [draft, setDraft] = useState(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  // 一键把全部 Markdown 打包下载（防丢保险）
  const backup = async () => {
    try {
      const r = await fetch("/api/backup");
      if (!r.ok) throw new Error();
      const blob = await r.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `miaomiaowu-backup-${new Date().toISOString().slice(0, 10)}.md`;
      a.click();
      URL.revokeObjectURL(a.href);
      setMsg({ type: "ok", text: "备份已下载：博客与足迹的全部 Markdown" });
    } catch {
      setMsg({ type: "error", text: "备份失败：本地 dev 服务还在吗？" });
    }
  };
  const taRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/posts");
        if (!r.ok) throw new Error();
        const list = await r.json();
        list.sort((a, b) => b.date.localeCompare(a.date));
        setPosts(list);
        setApiOk(true);
      } catch {
        setApiOk(false);
      }
    })();
  }, []);

  const beginEdit = async (p) => {
    const r = await fetch(`/api/posts/${encodeURIComponent(p.slug)}`);
    if (!r.ok) return setMsg({ type: "error", text: "读取失败" });
    const data = await r.json();
    setDraft({ slug: data.slug, title: data.title, date: data.date || today(), tag: data.tag, content: data.content });
    setEditing({ slug: p.slug, filename: p.filename });
    setMsg(null);
    window.scrollTo(0, 0);
  };

  const beginCreate = () => {
    setDraft(emptyDraft());
    setEditing({ slug: null });
    setMsg(null);
    window.scrollTo(0, 0);
  };

  const backToList = () => {
    setEditing(null);
    setMsg(null);
  };

  // —— 工具栏：把 Markdown 语法快捷插到光标处 ——
  const patchContent = (next, selStart, selEnd) => {
    setDraft({ ...draft, content: next });
    requestAnimationFrame(() => {
      const ta = taRef.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(selStart, selEnd);
    });
  };

  // 行内包裹：选中文字则包裹，未选中则插入示例并选中示例
  const wrapInline = (before, after, sample) => {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const value = ta.value;
    const selected = value.slice(s, e);
    const text = selected || sample;
    const next = value.slice(0, s) + before + text + after + value.slice(e);
    patchContent(next, s + before.length, s + before.length + text.length);
  };

  // 行首标记：在光标所在行首插入（#、>、- 等）
  const lineMark = (marker) => {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const value = ta.value;
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    const next = value.slice(0, lineStart) + marker + value.slice(lineStart);
    const pos = lineStart + marker.length;
    patchContent(next, pos, pos);
  };

  // —— 图片上传：把剪贴板里的图片发到 /api/uploads，返回可引用的 /uploads/xx ——
  const uploadImage = (file) =>
    new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = async () => {
        try {
          const r = await fetch("/api/uploads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: file.name || "", dataUrl: fr.result }),
          });
          const j = await r.json();
          resolve(r.ok && j.url ? j.url : null);
        } catch {
          resolve(null);
        }
      };
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(file);
    });

  // 从剪贴板文本/HTML 里捞图片地址：适用于「复制图片链接」或网页图片位图读不到时的兜底
  const pickImageUrlFromClipboard = (cd) => {
    const html = cd?.getData("text/html") || "";
    const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    const candidate = m ? m[1] : (cd?.getData("text/plain") || "").trim().split(/\r?\n/)[0].trim();
    if (/^https?:\/\/\S+\.(?:png|jpe?g|webp|gif|avif|svg)(?:[?#]\S*)?$/i.test(candidate)) return candidate;
    return null;
  };

  // 在光标 ins 处插入一段 Markdown，并把光标挪到插入内容后
  const insertMd = (ins, md) => {
    setDraft((prev) => {
      const cur = prev.content;
      return { ...prev, content: cur.slice(0, ins) + md + cur.slice(ins) };
    });
    const pos = ins + md.length;
    requestAnimationFrame(() => {
      if (taRef.current) {
        taRef.current.focus();
        taRef.current.setSelectionRange(pos, pos);
      }
    });
  };

  // 在正文里直接粘贴图片 → 自动处理成 Markdown 图片语法
  const handlePaste = async (e) => {
    const cd = e.clipboardData;
    if (!cd) return;
    const items = Array.from(cd.items || []);
    const files = items
      .filter((it) => it.kind === "file" && (it.type || "").startsWith("image/"))
      .map((it) => it.getAsFile())
      .filter(Boolean);
    const ta = taRef.current;
    if (!ta) return;
    const ins = ta.selectionStart;

    // 情况1：剪贴板里带位图（本地文件 / 多数网页图片）→ 转存到 public/uploads
    if (files.length) {
      e.preventDefault();
      setMsg({ type: "info", text: `正在上传 ${files.length} 张图片…` });
      const blocks = [];
      for (const f of files) {
        const url = await uploadImage(f);
        if (url) {
          const alt = (f.name || "图片").replace(/\.[^.]+$/, "");
          blocks.push(`![${alt}](${url})`);
        }
      }
      if (blocks.length < files.length) {
        // 有图读不到位图（跨域保护等）→ 用剪贴板里的原链接兜底
        const src = pickImageUrlFromClipboard(cd);
        if (src) blocks.push(`![图片](${src})`);
        setMsg({ type: "info", text: src ? "部分图片无法转存，已改用原链接插入" : "图片转存失败，请重试" });
      } else {
        setMsg({ type: "ok", text: `已转存并插入 ${blocks.length} 张图片` });
      }
      if (blocks.length) insertMd(ins, blocks.join("\n"));
      return;
    }

    // 情况2：粘贴的是图片链接（纯 URL 或 <img src>）→ 直接转成 Markdown 外链图片
    const src = pickImageUrlFromClipboard(cd);
    if (src) {
      e.preventDefault();
      const clean = src.split("?")[0].split("#")[0];
      const alt = (clean.split("/").pop() || "图片").replace(/\.[^.]+$/, "");
      insertMd(ins, `![${alt}](${src})`);
      setMsg({ type: "ok", text: "已把图片链接转为 Markdown 图片（外链原样引用，未转存）" });
    }
    // 其余普通文本粘贴：不拦截，走浏览器默认
  };

  const save = async () => {
    const title = draft.title.trim();
    if (!title) return setMsg({ type: "error", text: "先给文章起个标题吧" });
    const isNew = !editing.slug;
    if (isNew) {
      if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(draft.slug.trim())) {
        return setMsg({ type: "error", text: "slug 需为英文/数字/下划线/短横线（如 my-first-post）" });
      }
    }
    setSaving(true);
    try {
      const url = isNew ? "/api/posts" : `/api/posts/${encodeURIComponent(editing.slug)}`;
      const method = isNew ? "POST" : "PUT";
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await r.json();
      if (!r.ok) {
        setMsg({ type: "error", text: data.error ?? "保存失败" });
        return;
      }
      const list = await (await fetch("/api/posts")).json();
      list.sort((a, b) => b.date.localeCompare(a.date));
      setPosts(list);
      setMsg({ type: "ok", text: "已保存，博客列表已更新，即将返回" });
      setTimeout(backToList, 500);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    const ok = window.confirm(`删除「${p.title}」？\n文件将移入 posts/.trash/，可手动找回，站点文章将立即移除。`);
    if (!ok) return;
    const r = await fetch(`/api/posts/${encodeURIComponent(p.slug)}`, { method: "DELETE" });
    if (!r.ok) {
      setMsg({ type: "error", text: "删除失败" });
      return;
    }
    const list = posts.filter((x) => x.slug !== p.slug);
    setPosts(list);
    setMsg({ type: "ok", text: `已删除「${p.title}」，文件在 posts/.trash/` });
  };

  // —— 接口不可用 ——
  if (apiOk === false) {
    return (
      <div className="container page">
        <div className="admin-note">
          <span className="admin-note-no">01</span>
          <h2>写作接口只在本地开着</h2>
          <p>这个写作台依赖本地 dev 服务写文件的能力，正式上线后的纯静态站点没有这一层。</p>
          <p className="admin-hint">本地开发时运行 npm run dev，再访问 /admin 即可正常写作。</p>
          <Link to="/blog" className="admin-link">
            ← 返回博客
          </Link>
        </div>
      </div>
    );
  }

  // —— 正在加载（骨架屏） ——
  if (apiOk === null) {
    return (
      <div className="container admin">
        <div className="admin-head">
          <div className="admin-title-lg admin-skeleton-line" />
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

  // —— 编辑器 ——
  if (editing) {
    const preview = draft.content.trim() ? marked.parse(draft.content) : "";
    const wordCount = draft.content.trim().length;
    return (
      <div className="container admin">
        <div className="admin-head">
          <button className="admin-btn admin-btn-text" onClick={backToList}>
            ← 返回文章列表
          </button>
          <button className="admin-btn admin-btn-ghost" onClick={backToList}>
            退出编辑
          </button>
        </div>

        <header className="admin-editor-head">
          <span className="admin-kicker">{editing.slug ? "EDIT" : "NEW"}</span>
          <h1 className="admin-editor-h1">{editing.slug ? "改这篇文章" : "写一篇新的"}</h1>
          <p className="admin-editor-sub">
            {editing.slug
              ? `正在修改 · /blog/${editing.slug}`
              : "Markdown 写作，右侧实时预览，保存即上架"}
          </p>
        </header>

        <div className="admin-paper">
          <div className="admin-meta-grid">
            <label className="admin-field admin-field-title">
              <span>标题</span>
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="起个像样的标题"
              />
            </label>
            <label className="admin-field">
              <span>slug（文章地址，仅限英文）</span>
              <input
                value={draft.slug}
                disabled={editing.slug ? true : false}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value.trim() })}
                placeholder="my-first-post"
              />
              {editing.slug && <em className="admin-em">改 slug 需新建后删除旧文</em>}
            </label>
            <label className="admin-field">
              <span>标签（可选）</span>
              <input
                value={draft.tag}
                onChange={(e) => setDraft({ ...draft, tag: e.target.value })}
                placeholder="随笔 / 技术 / 生活…"
              />
            </label>
          </div>

          <div className="admin-body-grid">
            <section className="admin-write">
              <div className="admin-label">
                <span>Markdown 正文</span>
                <span className="admin-count">{wordCount} 字</span>
              </div>
              <div className="admin-toolbar" role="toolbar" aria-label="Markdown 快捷格式">
                <button type="button" className="admin-tb" title="粗体" onClick={() => wrapInline("**", "**", "粗体文字")}>
                  B
                </button>
                <button type="button" className="admin-tb" title="斜体" onClick={() => wrapInline("*", "*", "斜体文字")}>
                  I
                </button>
                <span className="admin-tb-sep" />
                <button type="button" className="admin-tb" title="一级标题" onClick={() => lineMark("# ")}>
                  H1
                </button>
                <button type="button" className="admin-tb" title="二级标题" onClick={() => lineMark("## ")}>
                  H2
                </button>
                <button type="button" className="admin-tb" title="三级标题" onClick={() => lineMark("### ")}>
                  H3
                </button>
                <span className="admin-tb-sep" />
                <button type="button" className="admin-tb" title="引用" onClick={() => lineMark("> ")}>
                  “
                </button>
                <button type="button" className="admin-tb" title="行内代码" onClick={() => wrapInline("`", "`", "code")}>
                  {"</>"}
                </button>
                <button type="button" className="admin-tb" title="链接" onClick={() => wrapInline("[", "](https://)", "链接文字")}>
                  链接
                </button>
                <button type="button" className="admin-tb" title="图片：直接把图片 Ctrl+V 粘贴到正文，自动上传转 Markdown" onClick={() => wrapInline("![", "](https://)", "图片描述")}>
                  图片
                </button>
                <button type="button" className="admin-tb" title="无序列表" onClick={() => lineMark("- ")}>
                  列表
                </button>
              </div>
              <textarea
                ref={taRef}
                value={draft.content}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                onPaste={handlePaste}
                placeholder={"用 Markdown 慢慢写…\n\n## 小标题\n\n正文内容，右侧会实时排版。\n\n粘贴图片（Ctrl+V）会自动上传并插入 Markdown。"}
                spellCheck={false}
              />
            </section>
            <section className="admin-preview">
              <div className="admin-label">
                <span>预览 · 定格排版</span>
                {preview && <span className="admin-count">所见即所得</span>}
              </div>
              {preview ? (
                <div className="admin-preview-body post-body" dangerouslySetInnerHTML={{ __html: preview }} />
              ) : (
                <div className="admin-preview-empty">
                  <span className="admin-empty-corner" aria-hidden="true" />
                  <span className="admin-empty-title">纸上还空着</span>
                  <span className="admin-empty-desc">左侧落笔会实时排版到这里，也可以先用工具栏：</span>
                  <div className="admin-empty-hints">
                    <span>
                      <i>H1</i> 起个标题
                    </span>
                    <span>
                      <i>-</i> 列表
                    </span>
                  </div>
                </div>
              )}
            </section>
          </div>

          {msg && <div className={`admin-msg admin-msg-${msg.type}`}>{msg.text}</div>}
          <div className="admin-actions">
            <button className="admin-btn admin-btn-primary" onClick={save} disabled={saving}>
              {saving ? "保存中…" : editing.slug ? "保存修改" : "保存上架"}
            </button>
            <span className="admin-hint">日期自动 · 新文章取今天，编辑保留原日期</span>
            <span className="admin-hint admin-hint-right">保存后博客页立即生效</span>
          </div>
        </div>
      </div>
    );
  }

  // —— 文章列表 ——
  return (
    <div className="container admin">
      <div className="admin-head">
        <Link to="/blog" className="admin-btn admin-btn-text">
          ← 返回站点
        </Link>
        <button className="admin-btn admin-btn-primary" onClick={beginCreate}>
          ＋ 写新文章
        </button>
        <button className="admin-btn" onClick={backup} title="把全部 Markdown 打包下载">
          ⬇ 备份全部
        </button>
      </div>

      <header className="admin-list-head">
        <span className="admin-kicker">DRAFT DESK</span>
        <h1 className="admin-list-h1">写作台</h1>
        <p className="admin-list-sub">共 {posts.length} 篇草稿 · 本地 Markdown 写作</p>
      </header>

      {msg && <div className={`admin-msg admin-msg-${msg.type}`}>{msg.text}</div>}

      {posts.length === 0 ? (
        <div className="admin-note">
          <span className="admin-note-no">00</span>
          <h2>一张纸都还没有</h2>
          <p>点右上角「写新文章」，落笔第一篇。</p>
        </div>
      ) : (
        <div className="admin-list">
          {posts.map((p, idx) => (
            <article className="admin-row" key={p.slug}>
              <span className="admin-row-no">{String(idx + 1).padStart(2, "0")}</span>
              <div className="admin-row-main">
                <Link to={`/blog/${p.slug}`} className="admin-row-title">
                  {p.title}
                </Link>
                <div className="admin-row-meta">
                  <span className="admin-row-date">{prettyDate(p.date)}</span>
                  <span className="admin-row-slug">/blog/{p.slug}</span>
                </div>
              </div>
              <div className="admin-row-side">
                {p.tag ? <span className="admin-tag">{p.tag}</span> : <span className="admin-tag admin-tag-muted">未分类</span>}
                <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => beginEdit(p)}>
                  编辑
                </button>
                <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => remove(p)}>
                  删除
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="admin-footnote">写作接口仅在本地 dev 模式生效（npm run dev）；上线后的静态站点此页自动降级为提示，不具备写文件能力。</p>
    </div>
  );
}
