import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { posts } from "../utils/post.js";
import { records, cityOf } from "../utils/explore.js";
import { collections, TYPE_LABEL as COL_LABEL } from "../data/collections.js";
import "./CommandPalette.css";

// 全站搜索索引：静态页面 + 博客 + 足迹 + 私藏（数据全部构建期就绪，零请求）
const PAGES = [
  { label: "首页", path: "/", hint: "起点" },
  { label: "博客", path: "/blog", hint: "文章列表" },
  { label: "探索 · 足迹地图", path: "/explore", hint: "吃过的走过的" },
  { label: "私藏", path: "/collections", hint: "收藏册" },
  { label: "作品集", path: "/projects", hint: "做过的东西" },
  { label: "关于我", path: "/about", hint: "档案" },
];

function buildIndex() {
  return [
    { group: "页面", items: PAGES },
    {
      group: "博客",
      items: posts.map((p) => ({
        label: p.title,
        path: `/blog/${p.slug}`,
        hint: `${p.date} · ${p.tag}`,
        text: `${p.tag} ${p.excerpt}`,
      })),
    },
    {
      group: "足迹",
      items: records.map((r) => ({
        label: r.title,
        path: `/explore/${r.slug}`,
        hint: `${r.date} · ${r.type === "food" ? "吃饭" : "景点"}`,
        text: `${r.place} ${cityOf(r.place)} ${r.excerpt}`,
      })),
    },
    {
      group: "私藏",
      items: collections.map((c) => ({
        label: c.title,
        path: "/collections",
        hint: COL_LABEL[c.type] ?? c.type,
        text: `${c.creator ?? ""} ${c.note ?? ""}`,
      })),
    },
  ].filter((g) => g.items.length);
}

export default function CommandPalette({ onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const index = useMemo(() => buildIndex(), []);

  // 过滤：标题命中优先，其次全文命中；每组最多取 6 条
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (it) =>
      !q ||
      it.label.toLowerCase().includes(q) ||
      String(it.text ?? "").toLowerCase().includes(q) ||
      String(it.hint ?? "").toLowerCase().includes(q);
    return index
      .map((g) => ({ ...g, items: g.items.filter(match).slice(0, 6) }))
      .filter((g) => g.items.length);
  }, [index, query]);

  // 行模型：分组标题行 + 可选项行（idx 是键盘选择的扁平序号）
  const { rows, total } = useMemo(() => {
    const rows = [];
    let idx = 0;
    for (const g of groups) {
      rows.push({ kind: "group", key: g.group, label: g.group });
      for (const it of g.items) rows.push({ kind: "item", group: g.group, idx: idx++, ...it });
    }
    return { rows, total: idx };
  }, [groups]);

  // 搜索词变化导致结果变少时，把选中项钳回有效范围（无需 effect）
  const selIdx = Math.min(sel, Math.max(0, total - 1));

  // 打开即聚焦，body 锁滚动
  useEffect(() => {
    inputRef.current?.focus();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
    };
  }, []);

  // 选中项滚进可视区
  useEffect(() => {
    listRef.current?.querySelector('[data-sel="1"]')?.scrollIntoView({ block: "nearest" });
  }, [selIdx, rows]);

  const go = (it) => {
    if (!it) return;
    onClose();
    navigate(it.path);
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") return onClose();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((i) => Math.min(i + 1, total - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(rows.filter((r) => r.kind === "item").find((r) => r.idx === selIdx));
    }
  };

  return (
    <div className="cmdk-overlay" role="dialog" aria-modal="true" aria-label="全站搜索" onClick={onClose}>
      <div className="cmdk" onClick={(e) => e.stopPropagation()}>
        <div className="cmdk-bar">
          <span className="cmdk-logo" aria-hidden="true">
            ⌕
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="搜文章、足迹、私藏，或跳转页面…"
            spellCheck={false}
            aria-label="搜索"
          />
          <kbd className="cmdk-esc">Esc</kbd>
        </div>

        {total === 0 ? (
          <div className="cmdk-empty">没有匹配「{query}」的内容</div>
        ) : (
          <div className="cmdk-list" ref={listRef}>
            {rows.map((row) =>
              row.kind === "group" ? (
                <div className="cmdk-group" key={`g-${row.key}`}>
                  {row.label}
                </div>
              ) : (
                <button
                  type="button"
                  key={`${row.group}-${row.label}-${row.path}`}
                  data-sel={row.idx === selIdx ? "1" : "0"}
                  className={`cmdk-item${row.idx === selIdx ? " is-sel" : ""}`}
                  onMouseEnter={() => setSel(row.idx)}
                  onClick={() => go(row)}
                >
                  <span className="cmdk-item-label">{row.label}</span>
                  <span className="cmdk-item-hint">{row.hint}</span>
                </button>
              ),
            )}
          </div>
        )}

        <div className="cmdk-foot">
          <span>↑↓ 选择</span>
          <span>↳ 跳转</span>
          <span>Esc 关闭</span>
        </div>
      </div>
    </div>
  );
}
