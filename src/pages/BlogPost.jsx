import { Link, useParams } from "react-router-dom";
import posts, { readingTime } from "../utils/post.js";
import { downloadSharePoster } from "../utils/sharePoster.js";
import { usePageTitle } from "../utils/usePageTitle.js";
import PostBody from "../components/PostBody.jsx";
import ReadProgress from "../components/ReadProgress.jsx";

export default function BlogPost() {
  const { slug } = useParams();
  const idx = posts.findIndex((p) => p.slug === slug);
  const post = idx === -1 ? null : posts[idx];
  usePageTitle(post?.title, post?.excerpt);
  const prev = idx > 0 ? posts[idx - 1] : null;
  const next = idx >= 0 && idx < posts.length - 1 ? posts[idx + 1] : null;

  if (!post) {
    return (
      <div className="container page page-post page-post-empty">
        <div className="empty">
          这篇手记不存在或已被撕掉
          <br />
          <Link to="/blog" className="back-link">
            ← 返回博客目录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page page-post">
      <ReadProgress />
      <Link to="/blog" className="post-back">
        <span aria-hidden="true">←</span> 博客目录
      </Link>

      <article className="post-paper">
        <header className="post-head">
          <div className="post-head-meta">
            <time dateTime={post.date}>{post.date}</time>
            <span className="post-head-dot" aria-hidden="true" />
            <span className="post-head-tag">{post.tag}</span>
            <span className="post-head-dot" aria-hidden="true" />
            <span>{readingTime(post)}</span>
          </div>
          <h1>{post.title}</h1>
          <div className="post-head-actions">
            <button
              type="button"
              className="share-btn"
              onClick={() =>
                downloadSharePoster({
                  kicker: `BLOG · ${post.tag}`,
                  title: post.title,
                  excerpt: post.excerpt,
                  meta: `${post.date} · ${readingTime(post)}`,
                })
              }
            >
              📸 生成分享图
            </button>
          </div>
        </header>
        <PostBody className="post-body" html={post.content} />
      </article>

      {(prev || next) && (
        <nav className="post-pager" aria-label="相邻文章">
          {prev ? (
            <Link to={`/blog/${prev.slug}`} className="post-pager-link post-pager-prev">
              <span className="post-pager-label">上一篇</span>
              <span className="post-pager-title">{prev.title}</span>
            </Link>
          ) : (
            <span className="post-pager-empty" aria-hidden="true" />
          )}
          {next ? (
            <Link to={`/blog/${next.slug}`} className="post-pager-link post-pager-next">
              <span className="post-pager-label">下一篇</span>
              <span className="post-pager-title">{next.title}</span>
            </Link>
          ) : (
            <span className="post-pager-empty" aria-hidden="true" />
          )}
        </nav>
      )}

      <div className="post-end">
        <Link to="/blog" className="post-back post-back-bottom">
          <span aria-hidden="true">←</span> 返回博客目录
        </Link>
      </div>
    </div>
  );
}
