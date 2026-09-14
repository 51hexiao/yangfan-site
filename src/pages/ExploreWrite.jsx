import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import LocationPicker from "../components/LocationPicker.jsx";
import { EXPLORE_ICONS, typeEmoji } from "../utils/exploreIcons.js";
import "./Explore.css";

const today = () => new Date().toISOString().slice(0, 10);

const TYPES = [
  { key: "food", label: "吃饭" },
  { key: "spot", label: "景点" },
];

function emptyDraft() {
  return {
    slug: "",
    title: "",
    date: today(),
    type: "food",
    icon: "",
    place: "",
    lat: null,
    lng: null,
    images: [],
    content: "",
  };
}

const toNum = (v) => {
  const raw = String(v ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = () => resolve("");
    fr.readAsDataURL(file);
  });
}

// 手机照片常见几 MB 起步，超过 3MB 先在浏览器里压一道，免得撞上服务端 8MB 上限
async function prepareImage(file) {
  if (file.size <= 3 * 1024 * 1024 || file.type === "image/gif") return fileToDataUrl(file);
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    return canvas.toDataURL("image/jpeg", 0.86);
  } catch {
    return fileToDataUrl(file);
  }
}

export default function ExploreWrite() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const wantSlug = params.get("slug") || "";

  const [apiOk, setApiOk] = useState(null);
  const [list, setList] = useState([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState(null);
  // 手动选过「吃饭/景点」或图钉图标后，就不再根据地点类型自动匹配了
  const typeTouched = useRef(false);
  const iconTouched = useRef(false);

  const patch = useCallback((next) => setDraft((d) => ({ ...d, ...next })), []);

  // 读列表；带 ?slug= 时顺带进编辑态
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/explore");
        if (!r.ok) throw new Error("接口不可用");
        const data = await r.json();
        if (!alive) return;
        setList(data);
        setApiOk(true);
        if (!wantSlug) return;
        const one = data.find((x) => x.slug === wantSlug);
        if (!one) {
          setMsg({ type: "error", text: "没找到这一笔，可能已经被删了" });
          return;
        }
        setDraft({
          slug: one.slug,
          title: one.title ?? "",
          date: one.date || today(),
          type: one.type === "food" ? "food" : "spot",
          icon: one.icon ?? "",
          place: one.place ?? "",
          lat: toNum(one.lat),
          lng: toNum(one.lng),
          images: Array.isArray(one.images) ? one.images : [],
          content: one.content ?? "",
        });
        setEditing({ slug: one.slug });
        typeTouched.current = true; // 编辑旧记录时尊重原有的类型
        iconTouched.current = Boolean(one.icon);
      } catch {
        if (alive) setApiOk(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [wantSlug]);

  // —— 图片：上传 → /uploads/xx ——
  const addFiles = async (files) => {
    const imgs = Array.from(files || []).filter((f) => (f.type || "").startsWith("image/"));
    if (!imgs.length) return;
    setUploading(true);
    setMsg({ type: "info", text: `正在上传 ${imgs.length} 张图片…` });
    const urls = [];
    for (const f of imgs) {
      try {
        const dataUrl = await prepareImage(f);
        if (!dataUrl) continue;
        const r = await fetch("/api/uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: f.name || "", dataUrl }),
        });
        const j = await r.json();
        if (r.ok && j.url) urls.push(j.url);
      } catch {
        /* 单张失败不影响其余 */
      }
    }
    setUploading(false);
    if (!urls.length) {
      setMsg({ type: "error", text: "图片没能上传，换个格式或压小一点再试" });
      return;
    }
    setDraft((d) => ({ ...d, images: [...d.images, ...urls].slice(0, 9) }));
    setMsg({ type: "ok", text: `已加入 ${urls.length} 张图片` });
  };

  const onPaste = (e) => {
    const files = Array.from(e.clipboardData?.items || [])
      .filter((it) => it.kind === "file" && (it.type || "").startsWith("image/"))
      .map((it) => it.getAsFile())
      .filter(Boolean);
    if (!files.length) return;
    e.preventDefault();
    addFiles(files);
  };

  const dropImage = (idx) => patch({ images: draft.images.filter((_, i) => i !== idx) });

  const setCover = (idx) => {
    const arr = [...draft.images];
    const [one] = arr.splice(idx, 1);
    patch({ images: [one, ...arr] });
  };

  // —— 保存 ——
  const save = async () => {
    if (!draft.content.trim() && draft.images.length === 0) {
      setMsg({ type: "error", text: "写点什么，或者至少放一张图" });
      return;
    }
    setBusy(true);
    try {
      const isNew = !editing?.slug;
      const url = isNew ? "/api/explore" : `/api/explore/${encodeURIComponent(editing.slug)}`;
      // 图标：手动选的（或选点时自动匹配上的）原样存；都没有就按类型兜底
      const payload = { ...draft, icon: draft.icon || typeEmoji(draft.type) };
      const r = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) {
        setMsg({ type: "error", text: data.error ?? "保存失败" });
        return;
      }
      navigate(`/explore/${data.slug}`);
    } catch {
      setMsg({ type: "error", text: "保存失败：本地 dev 服务还在吗？" });
    } finally {
      setBusy(false);
    }
  };

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

  const remove = async (slug, title) => {
    if (!window.confirm(`删除「${title || slug}」？\n文件会移入 explore/.trash/，可手动找回。`)) return;
    const r = await fetch(`/api/explore/${encodeURIComponent(slug)}`, { method: "DELETE" });
    if (!r.ok) {
      setMsg({ type: "error", text: "删除失败" });
      return;
    }
    setList((l) => l.filter((x) => x.slug !== slug));
    setMsg({ type: "ok", text: `已删除「${title || slug}」，文件在 explore/.trash/` });
  };

  const resetDraft = () => {
    setDraft(emptyDraft());
    setEditing(null);
    setMsg(null);
    window.scrollTo(0, 0);
  };

  // —— 接口不可用（正式构建访问） ——
  if (apiOk === false) {
    return (
      <div className="container page exw">
        <div className="ex-empty">
          <span className="ex-empty-mark">DEV</span>
          <p>写作台只在本地开着</p>
          <p className="ex-empty-hint">
            它靠本地 dev 服务直接写 Markdown 文件，上线后的纯静态站点没有这一层。
            <br />
            本地跑 <code>npm run dev</code>，再访问 /explore/write 即可。
          </p>
          <p className="ex-empty-hint">
            <Link to="/explore">← 回到探索</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container page exw" onPaste={onPaste}>
      <div className="exw-head">
        <div>
          <span className="page-kicker">{editing ? "EDIT" : "NEW"}</span>
          <h1 className="exw-title-lg">{editing ? "改这一笔" : "记一笔"}</h1>
          <p className="exw-sub">
            {editing ? `正在修改 · /explore/${editing.slug}` : "像发朋友圈一样：写两句、传几张图、标个位置"}
          </p>
        </div>
        <Link to="/explore" className="ex-btn ex-btn-ghost">
          ← 返回探索
        </Link>
        <button type="button" className="ex-btn" onClick={backup} title="把 posts/ 与 explore/ 的全部 Markdown 打包下载">
          ⬇ 备份全部
        </button>
      </div>

      <div className="exw-paper">
        <textarea
          className="exw-area"
          value={draft.content}
          onChange={(e) => patch({ content: e.target.value })}
          placeholder={"今天吃了什么、走到哪儿了…\n\n直接把图片 Ctrl+V 粘进来也能传。"}
          spellCheck={false}
        />

        <div className="exw-block">
          <div className="exw-block-label">
            <span>图片 · 九宫格（最多 9 张，第一张当封面）</span>
            <span>{uploading ? "上传中…" : `${draft.images.length} / 9`}</span>
          </div>
          <div className="exw-grid">
            {draft.images.map((src, i) => (
              <div className="exw-tile" key={`${src}-${i}`}>
                <img src={src} alt="" />
                <button
                  type="button"
                  className="exw-tile-x"
                  title="移除"
                  onClick={() => dropImage(i)}
                >
                  ×
                </button>
                {i === 0 ? (
                  <span className="exw-tile-cover">封面</span>
                ) : (
                  <button
                    type="button"
                    className="exw-tile-cover"
                    title="设为封面"
                    onClick={() => setCover(i)}
                  >
                    设为封面
                  </button>
                )}
              </div>
            ))}
            {draft.images.length < 9 && (
              <button type="button" className="exw-tile exw-tile-add" onClick={() => fileRef.current?.click()}>
                <span>＋</span>
                <span>选图 / 粘贴</span>
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        <div className="exw-block exw-row">
          <div className="exw-field">
            <span>这是</span>
            <div className="exw-seg">
              {TYPES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`${draft.type === t.key ? "active" : ""}${t.key === "food" ? " is-food" : ""}`}
                  onClick={() => {
                    typeTouched.current = true;
                    patch({ type: t.key });
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <label className="exw-field">
            <span>日期</span>
            <input
              type="date"
              value={draft.date}
              onChange={(e) => patch({ date: e.target.value })}
            />
          </label>

          <label className="exw-field exw-field-grow">
            <span>标题（可不填，默认用地点）</span>
            <input
              value={draft.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="楼外楼（孤山路店）"
            />
          </label>
        </div>

        <div className="exw-block">
          <div className="exw-block-label">
            <span>地点</span>
            <span>搜地点或地图点一下；搜到餐厅美食会自动把类型归到「吃饭」</span>
          </div>
          <LocationPicker
            value={{ place: draft.place, lat: draft.lat, lng: draft.lng }}
            onChange={(v) => {
              const next = { lat: v.lat, lng: v.lng };
              if (v.place) next.place = v.place;
              if (v.matchedType && !typeTouched.current) next.type = v.matchedType;
              if (v.matchedIcon && !iconTouched.current) next.icon = v.matchedIcon;
              patch(next);
            }}
          />
        </div>

        <div className="exw-block">
          <div className="exw-block-label">
            <span>图钉图标</span>
            <span>{draft.icon ? `当前：${draft.icon}` : "自动 · 按地点类型匹配"}</span>
          </div>
          <div className="exw-icons">
            <button
              type="button"
              className={`exw-icon-chip${draft.icon ? "" : " active"}`}
              title="不指定，按地点类型自动配"
              onClick={() => {
                iconTouched.current = false;
                patch({ icon: "" });
              }}
            >
              自动
            </button>
            {EXPLORE_ICONS.map((i) => (
              <button
                key={i.emoji}
                type="button"
                className={`exw-icon-chip${draft.icon === i.emoji ? " active" : ""}`}
                title={i.label}
                onClick={() => {
                  iconTouched.current = true;
                  patch({ icon: i.emoji });
                }}
              >
                {i.emoji}
              </button>
            ))}
          </div>
        </div>

        {msg && <div className={`exw-msg exw-msg-${msg.type}`}>{msg.text}</div>}

        <div className="exw-actions">
          <button className="ex-btn ex-btn-primary" onClick={save} disabled={busy || uploading}>
            {busy ? "发布中…" : editing ? "保存修改" : "发表"}
          </button>
          {editing && (
            <button className="ex-btn" onClick={resetDraft}>
              改为新记一笔
            </button>
          )}
          <Link to="/explore" className="ex-btn ex-btn-ghost">
            取消
          </Link>
          <span className="exw-hint">发表后写入 explore/*.md，探索页与地图立即生效</span>
        </div>
      </div>

      {apiOk && list.length > 0 && (
        <section className="exw-list">
          <div className="ex-section-title">
            <h2>已记录</h2>
            <span>共 {list.length} 笔 · 最新在前</span>
          </div>
          <div style={{ marginTop: 14 }}>
            {list
              .slice()
              .sort((a, b) => String(b.date).localeCompare(String(a.date)))
              .map((r, i) => (
                <article className="exw-row-item" key={r.slug}>
                  <span className="exw-row-no">{String(i + 1).padStart(2, "0")}</span>
                  <div className="exw-row-main">
                    <Link to={`/explore/${r.slug}`} className="exw-row-title">
                      {r.title || r.slug}
                    </Link>
                    <div className="exw-row-meta">
                      <span>{r.date}</span>
                      <span>{r.type === "food" ? "吃饭" : "景点"}</span>
                      <span>{r.place || "未标位置"}</span>
                      <span>/explore/{r.slug}</span>
                    </div>
                  </div>
                  <div className="exw-row-side">
                    <Link className="ex-btn ex-btn-sm" to={`/explore/write?slug=${encodeURIComponent(r.slug)}`}>
                      编辑
                    </Link>
                    <button
                      className="ex-btn ex-btn-danger ex-btn-sm"
                      onClick={() => remove(r.slug, r.title)}
                    >
                      删除
                    </button>
                  </div>
                </article>
              ))}
          </div>
        </section>
      )}

      <p className="exw-footnote">
        写作接口仅在本地 dev 模式生效（npm run dev）；上线后的静态站点此页自动降级为提示，不具备写文件能力。
        图片存在 public/uploads/，随站点一起发布。
      </p>
    </div>
  );
}
