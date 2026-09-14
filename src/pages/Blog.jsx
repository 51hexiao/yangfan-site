import { useState } from "react";
import { Link } from "react-router-dom";
import posts, { allTags, readingTime } from "../utils/post.js";
import { usePageTitle } from "../utils/usePageTitle.js";

export default function Blog() {
  usePageTitle("博客");
  const [tag, setTag] = useState("全部");
  const filtered = tag === "全部" ? posts : posts.filter((p) => p.tag === tag);

  return (
    <div className="container page page-blog">
      <header className="page-head">
        <span className="page-kicker">ARCHIVE · 归档</span>
        <h1 className="page-title">博客手记</h1>
        <p className="page-subtitle">
          共 {posts.length} 篇文章 · 记录技术、思考与生活
          <Link className="blog-archive-link" to="/archive">
            按年份翻归档 →
          </Link>
        </p>
      </header>

      <div className="filter-bar" role="tablist" aria-label="按标签筛选">
        {allTags.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={t === tag}
            className={`filter-chip${t === tag ? " active" : ""}`}
            onClick={() => setTag(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="blog-empty">
          <span className="blog-empty-mark">空</span>
          <p>这个分类还没有落笔</p>
          <p className="blog-empty-hint">换个标签翻翻，或去写作台写一篇</p>
        </div>
      ) : (
        <div className="blog-list">
          {filtered.map((post, i) => (
            <Link
              to={`/blog/${post.slug}`}
              key={post.slug}
              className="blog-row"
            >
              <span className="blog-row-idx">
                {String(i + 1).padStart(2, "0")}
              </span>
              <time className="blog-row-date">{post.date}</time>
              <span className="blog-row-main">
                <span className="blog-row-title">
                  {post.title}
                  {post.draft && <span className="blog-row-tag blog-row-draft">草稿</span>}
                  <span className="blog-row-tag">{post.tag}</span>
                </span>
                <span className="blog-row-excerpt">{post.excerpt}</span>
              </span>
              <span className="blog-row-read">{readingTime(post)}</span>
              <span className="blog-row-go" aria-hidden="true">
                ↗
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
