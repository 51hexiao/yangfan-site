import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { gapDays, cityOf, trail, TYPE_LABEL } from "../utils/explore.js";
import { iconEmoji } from "../utils/exploreIcons.js";
import TrailMap from "../components/TrailMap.jsx";
import Lightbox from "../components/Lightbox.jsx";
import PostBody from "../components/PostBody.jsx";
import ReadProgress from "../components/ReadProgress.jsx";
import { downloadSharePoster } from "../utils/sharePoster.js";
import { usePageTitle } from "../utils/usePageTitle.js";
import "./Explore.css";

const pad2 = (n) => String(n).padStart(2, "0");

export default function ExplorePost() {
  const { slug } = useParams();
  const [lightbox, setLightbox] = useState(null); // { images, index }
  const rec = useMemo(() => trail.find((r) => r.slug === slug), [slug]);
  usePageTitle(rec?.title, rec?.excerpt);
  const points = useMemo(() => trail.filter((r) => r.hasGeo), []);

  if (!rec) {
    return (
      <div className="container page page-explore">
        <div className="ex-empty">
          <span className="ex-empty-mark">404</span>
          <p>没有这一笔记录</p>
          <p className="ex-empty-hint">
            <Link to="/explore">← 回到探索</Link>
          </p>
        </div>
      </div>
    );
  }

  const prev = trail.find((r) => r.no === rec.no - 1);
  const next = trail.find((r) => r.no === rec.no + 1);
  const total = trail.length;
  const imgs = rec.images.slice(0, 9);

  // 同城的其他足迹（城市从地点文案提取）
  const city = cityOf(rec.place);
  const cityMates = city
    ? trail.filter((r) => r.slug !== rec.slug && cityOf(r.place) === city)
    : [];

  // 与前后站的旅程间隔（天数）
  const prevGap = prev ? gapDays(prev, rec) : null;
  const nextGap = next ? gapDays(rec, next) : null;

  return (
    <div className="container page page-explore">
      <ReadProgress />
      <header className="ex-detail-head">
        {rec.cover && (
          <figure className="ex-postcard">
            <img src={rec.cover} alt={rec.title} />
            <span className="ex-stamp ex-postcard-stamp" aria-hidden="true">
              <time>{rec.date}</time>
              <em>NO.{pad2(rec.no)}</em>
            </span>
          </figure>
        )}

        <div className="ex-detail-top">
          <span className={`ex-badge ex-badge-${rec.type}`}>
            {iconEmoji(rec)} {TYPE_LABEL[rec.type]}
          </span>
          <span>
            NO.{pad2(rec.no)} / {pad2(total)}
          </span>
          {!rec.cover && (
            <>
              <span>·</span>
              <time>{rec.date}</time>
            </>
          )}
        </div>

        <h1 className="ex-detail-title">{rec.title}</h1>

        <div className="ex-detail-meta">
          {rec.place && <span>{rec.place}</span>}
          {rec.hasGeo && (
            <span className="ex-detail-geo">
              {rec.lng.toFixed(5)}, {rec.lat.toFixed(5)}
            </span>
          )}
          <button
            type="button"
            className="share-btn share-btn-inline"
            onClick={() =>
              downloadSharePoster({
                kicker: `TRAIL · ${TYPE_LABEL[rec.type]}${rec.place ? " · " + rec.place : ""}`,
                title: rec.title,
                excerpt: rec.excerpt || "这一笔没有留下文字，去看看照片吧。",
                meta: `NO.${String(rec.no).padStart(2, "0")} · ${rec.date}`,
              })
            }
          >
            📸 生成分享图
          </button>
        </div>

        {cityMates.length > 0 && (
          <Link
            className="ex-city-chip"
            to={`/explore?city=${encodeURIComponent(city)}`}
            title="查看同城的其它足迹"
          >
            📍 {city} · 同城还有 {cityMates.length} 站 →
          </Link>
        )}
      </header>

      <div className="ex-detail-layout">
        <div className="ex-detail-main">
          <PostBody className="ex-detail-body post-body" html={rec.content} />

          {imgs.length > 0 && (
            <div className={`ex-grid ex-detail-grid ex-grid-${Math.min(imgs.length, 3)}`}>
              {imgs.map((src, idx) => (
                <span
                  className="ex-grid-cell"
                  key={src}
                  onClick={() => setLightbox({ images: imgs, index: idx })}
                >
                  <img src={src} alt="" loading="lazy" />
                </span>
              ))}
            </div>
          )}

          <p className="ex-detail-sign">—— 杨帆，写于妙妙屋</p>
        </div>

        <aside className="ex-rail">
          <div className="ex-rail-card ex-rail-info">
            <span className="ex-rail-kicker">INFO · 这一站</span>
            <span className="ex-rail-ico">{iconEmoji(rec)}</span>
            <span className="ex-rail-no">
              NO.{pad2(rec.no)} <i>/ {pad2(total)} 站</i>
            </span>
            <span className="ex-rail-row">
              <time>{rec.date}</time>
            </span>
            {rec.place && <span className="ex-rail-row">{rec.place}</span>}
            {rec.hasGeo && (
              <span className="ex-rail-row ex-rail-geo">
                {rec.lng.toFixed(5)}, {rec.lat.toFixed(5)}
              </span>
            )}
          </div>

          {trail.length > 1 && (
            <nav className="ex-rail-card ex-rail-trail" aria-label="本程目录">
              <span className="ex-rail-kicker">TRAIL · 本程</span>
              <div className="ex-rail-trail-list">
                {trail.map((t) => (
                  <Link
                    key={t.slug}
                    to={`/explore/${t.slug}`}
                    className={`ex-rail-stop${t.slug === rec.slug ? " is-current" : ""}`}
                  >
                    <span className="ex-rail-stop-no">{pad2(t.no)}</span>
                    <span className="ex-rail-stop-title">{t.title}</span>
                    <span className="ex-rail-stop-ico">{iconEmoji(t)}</span>
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </aside>
      </div>

      <section className="ex-detail-map">
        <span className="ex-map-kicker">MAP · 这一站的位置</span>
        <TrailMap points={points} activeSlug={rec.slug} />
      </section>
      <p className="ex-map-hint">
        {rec.hasGeo ? "上面这张图里，高亮的就是这一站。" : "这一笔当时没记定位，所以地图上找不到它。"}
      </p>

      {import.meta.env.DEV && (
        <div className="ex-detail-tools">
          <Link to={`/explore/write?slug=${encodeURIComponent(rec.slug)}`} className="ex-btn">
            编辑这一笔
          </Link>
          <Link to="/explore/write" className="ex-btn ex-btn-ghost">
            ＋ 再记一笔
          </Link>
        </div>
      )}

      <nav className="ex-pager" aria-label="前后记录">
        {prev ? (
          <Link to={`/explore/${prev.slug}`} className="ex-pager-link">
            <span className="ex-pager-label">
              ← NO.{pad2(prev.no)}
              {prevGap ? ` · ${prevGap} 天前` : ""}
            </span>
            <span className="ex-pager-title">
              {iconEmoji(prev)} {prev.title}
            </span>
          </Link>
        ) : (
          <span className="ex-pager-blank">这是最早的一笔</span>
        )}
        {next ? (
          <Link to={`/explore/${next.slug}`} className="ex-pager-link next">
            <span className="ex-pager-label">
              NO.{pad2(next.no)}
              {nextGap ? ` · ${nextGap} 天后` : ""} →
            </span>
            <span className="ex-pager-title">
              {iconEmoji(next)} {next.title}
            </span>
          </Link>
        ) : (
          <span className="ex-pager-blank">这是最新的一笔</span>
        )}
      </nav>

      <p className="ex-map-hint">
        <Link to="/explore">← 回到探索总览</Link>
      </p>

      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          alt={rec.title}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
