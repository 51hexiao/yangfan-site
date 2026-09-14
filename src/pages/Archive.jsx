import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import posts, { readingTime } from "../utils/post.js";
import "./Archive.css";
import { usePageTitle } from "../utils/usePageTitle.js";

// 博客归档：按年份分组的时间线 + 标签筛选
export default function Archive() {
  usePageTitle("归档");
  const [tag, setTag] = useState("全部");

  const tags = useMemo(() => ["全部", ...new Set(posts.map((p) => p.tag))], []);
  const filtered = useMemo(
    () => (tag === "全部" ? posts : posts.filter((p) => p.tag === tag)),
    [tag],
  );

  // 按年份分组（posts 已是最新在前）
  const groups = useMemo(() => {
    const g = [];
    for (const p of filtered) {
      const y = p.date.slice(0, 4) || "未记日期";
      if (!g.length || g[g.length - 1].year !== y) g.push({ year: y, items: [p] });
      else g[g.length - 1].items.push(p);
    }
    return g;
  }, [filtered]);

  return (
    <div className="container page page-archive">
      <header className="page-head">
        <span className="page-kicker">TIMELINE · 时间线</span>
        <h1 className="page-title">归档</h1>
        <p className="page-subtitle">
          {filtered.length} 篇 · 按年份倒着翻，像账本一样。
          <Link className="blog-archive-link" to="/blog">
            ← 回博客列表
          </Link>
        </p>
      </header>

      <div className="filter-bar" role="tablist" aria-label="按标签筛选">
        {tags.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={t === tag}
            className={`filter-chip${t === tag ? " active" : ""}`}
            onClick={() => setTag(t)}
          >
            {t}
            <em className="arc-chip-num">{t === "全部" ? posts.length : posts.filter((p) => p.tag === t).length}</em>
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <div className="blog-empty">
          <span className="blog-empty-mark">空</span>
          <p>这个标签下还没有落笔</p>
        </div>
      ) : (
        groups.map((g) => (
          <section className="arc-year" key={g.year}>
            <h2 className="arc-year-label">
              {g.year}
              <span>{g.items.length} 篇</span>
            </h2>
            <div className="arc-list">
              {g.items.map((p) => (
                <Link to={`/blog/${p.slug}`} className="arc-row" key={p.slug}>
                  <time className="arc-row-date">{p.date.slice(5)}</time>
                  <span className="arc-row-main">
                    <span className="arc-row-title">{p.title}</span>
                    <span className="arc-row-tag">{p.tag}</span>
                  </span>
                  <span className="arc-row-read">{readingTime(p)}</span>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
