import { useMemo } from "react";
import { Link } from "react-router-dom";
import posts from "../utils/post.js";
import projects from "../data/projects.js";
import { records } from "../utils/explore.js";
import { collections } from "../data/collections.js";
import { usePageTitle } from "../utils/usePageTitle.js";

export default function Home() {
  usePageTitle();

  // 最近动态：博客 + 足迹 + 私藏混排的最新 6 条，站点永远显得活着
  const feed = useMemo(
    () =>
      [
        ...posts.map((p) => ({
          date: p.date,
          title: p.title,
          kind: "文章",
          path: `/blog/${p.slug}`,
          sub: p.excerpt,
        })),
        ...records.map((r) => ({
          date: r.date,
          title: r.title,
          kind: "足迹",
          path: `/explore/${r.slug}`,
          sub: r.place || r.excerpt,
        })),
        ...collections
          .filter((c) => c.date)
          .map((c) => ({
            date: c.date,
            title: `收藏了《${c.title}》`,
            kind: "私藏",
            path: "/collections",
            sub: c.note || c.creator || "",
          })),
      ]
        .sort((a, b) => String(b.date).localeCompare(String(a.date)))
        .slice(0, 6),
    [],
  );

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <h1>
              你好，我是 <span className="hero-name">杨帆</span>
            </h1>
            <p className="hero-desc">
              CS 在读，白天写代码，晚上在这间妙妙屋里记点思考、作品和日常。
            </p>
            <div className="hero-actions">
              <Link to="/projects" className="btn btn-primary">
                查看作品集
              </Link>
              <Link to="/blog" className="btn btn-outline">
                阅读博客
              </Link>
            </div>
            <p className="hero-links">
              <a
                href="https://github.com/51hexiao"
                target="_blank"
                rel="noreferrer"
              >
                GitHub <span aria-hidden="true">↗</span>
              </a>
              <span className="hero-links-sep" aria-hidden="true">
                ·
              </span>
              <a href="mailto:15279620917@162.com">
                邮箱 <span aria-hidden="true">↗</span>
              </a>
            </p>
          </div>
          <div className="hero-avatar-wrap">
            <div className="hero-avatar">
              <img src="/avatar.jpg" alt="头像" />
            </div>
          </div>
        </div>
      </section>

      <div className="container page home-content">
        <section className="section home-posts">
          <div className="home-section-head">
            <h2 className="home-section-title">
              <span className="home-section-no">01</span>最近动态
            </h2>
            <Link to="/explore" className="home-more">
              全部足迹 <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="home-post-list">
            {feed.map((item) => (
              <Link to={item.path} key={`${item.kind}-${item.title}-${item.date}`} className="home-post-row">
                <span className="home-post-date">{item.date}</span>
                <span className="home-post-main">
                  <span className="home-post-title">
                    {item.title}
                    <span className="home-post-tag">{item.kind}</span>
                  </span>
                  {item.sub && <span className="home-post-excerpt">{item.sub}</span>}
                </span>
                <span className="home-post-go" aria-hidden="true">
                  ↗
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="section home-projects">
          <div className="home-section-head">
            <h2 className="home-section-title">
              <span className="home-section-no">02</span>精选项目
            </h2>
            <Link to="/projects" className="home-more">
              全部项目 <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="home-projects-grid">
            {projects.slice(0, 2).map((p, i) => (
              <Link to="/projects" key={p.title} className="home-project">
                <span className="home-project-idx">0{i + 1}</span>
                <span className="home-project-emoji" aria-hidden="true">
                  {p.emoji}
                </span>
                <span className="home-project-main">
                  <span className="home-project-title">{p.title}</span>
                  <span className="home-project-desc">{p.desc}</span>
                </span>
                <span className="home-project-go" aria-hidden="true">
                  ↗
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
