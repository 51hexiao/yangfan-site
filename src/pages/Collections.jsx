import { useMemo, useState } from "react";
import { collections, TYPE_EMOJI, TYPE_LABEL } from "../data/collections.js";
import "./Collections.css";
import { usePageTitle } from "../utils/usePageTitle.js";

// 类型筛选：只列数据里出现过的类型，顺序按 TYPE_LABEL 定义
const ALL_TYPES = ["book", "movie", "music", "stuff", "site"];

const Stars = ({ n }) =>
  n ? (
    <span className="col-stars" title={`${n} / 5`}>
      {"★".repeat(n)}
      <i>{"☆".repeat(5 - n)}</i>
    </span>
  ) : null;

export default function Collections() {
  usePageTitle("私藏");
  const [type, setType] = useState("all");

  const counts = useMemo(() => {
    const m = { all: collections.length };
    collections.forEach((c) => {
      m[c.type] = (m[c.type] ?? 0) + 1;
    });
    return m;
  }, []);

  const list = useMemo(
    () => (type === "all" ? collections : collections.filter((c) => c.type === type)),
    [type],
  );

  const types = ALL_TYPES.filter((t) => counts[t]);

  return (
    <div className="container page page-collections">
      <header className="page-head">
        <span className="page-kicker">COLLECTION · 私藏</span>
        <h1 className="page-title">私藏</h1>
        <p className="page-subtitle">
          看过的、听过的、天天在用的，值得安利一把的都在这本收藏册里。
        </p>
      </header>

      {collections.length > 0 && (
        <div className="col-toolbar" role="tablist" aria-label="按类型筛选">
          <button
            type="button"
            role="tab"
            aria-selected={type === "all"}
            className={`filter-chip${type === "all" ? " active" : ""}`}
            onClick={() => setType("all")}
          >
            全部
            <em className="col-chip-num">{counts.all}</em>
          </button>
          {types.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={type === t}
              className={`filter-chip${type === t ? " active" : ""}`}
              onClick={() => setType(t)}
            >
              {TYPE_LABEL[t]}
              <em className="col-chip-num">{counts[t]}</em>
            </button>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <div className="col-empty">
          <span className="col-empty-mark">藏</span>
          <p>{type === "all" ? "收藏册还是空的" : `「${TYPE_LABEL[type]}」这一格还空着`}</p>
          <p className="col-empty-hint">往 src/data/collections.js 里添一条就出来了</p>
        </div>
      ) : (
        <div className="col-grid">
          {list.map((c, i) => {
            const inner = (
              <>
                <span className="col-card-ico" aria-hidden="true">
                  {c.emoji || TYPE_EMOJI[c.type] || "✦"}
                </span>
                <span className={`col-badge col-badge-${c.type}`}>{TYPE_LABEL[c.type]}</span>
                <Stars n={c.rating} />
                <h2 className="col-card-title">{c.title}</h2>
                {c.creator && <span className="col-card-creator">{c.creator}</span>}
                {c.note && <p className="col-card-note">{c.note}</p>}
                <span className="col-card-foot">
                  {c.url ? (
                    <span className="col-card-link">
                      前往看看 <b>↗</b>
                    </span>
                  ) : (
                    <span className="col-card-link col-card-link-none">私藏无链接</span>
                  )}
                </span>
              </>
            );
            return c.url ? (
              <a
                key={c.title}
                href={c.url}
                target="_blank"
                rel="noreferrer"
                className="col-card"
                style={{ "--i": i }}
              >
                {inner}
              </a>
            ) : (
              <div key={c.title} className="col-card" style={{ "--i": i }}>
                {inner}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
