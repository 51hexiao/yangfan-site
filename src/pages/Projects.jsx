import projects from "../data/projects.js";
import { usePageTitle } from "../utils/usePageTitle.js";

export default function Projects() {
  usePageTitle("作品集");
  return (
    <div className="container page page-projects">
      <header className="page-head">
        <span className="page-kicker">WORKS · 作品</span>
        <h1 className="page-title">作品集</h1>
        <p className="page-subtitle">我做过的一些项目和东西</p>
      </header>

      <div className="works-grid">
        {projects.map((p, i) => (
          <a
            href={p.link}
            target="_blank"
            rel="noreferrer"
            className="work-card"
            key={p.title}
          >
            <div className="work-card-top">
              <span className="work-idx">{String(i + 1).padStart(2, "0")}</span>
              <span className="work-emoji" aria-hidden="true">
                {p.emoji}
              </span>
            </div>
            <h3 className="work-title">{p.title}</h3>
            <p className="work-desc">{p.desc}</p>
            <div className="work-bottom">
              <span className="work-tags">
                {p.tags.map((t) => (
                  <span className="work-tag" key={t}>
                    {t}
                  </span>
                ))}
              </span>
              <span className="work-go" aria-hidden="true">
                ↗
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
