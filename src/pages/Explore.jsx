import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  cityCount,
  cityOf,
  counts,
  gapDays,
  photoCount,
  records,
  totalKm,
  TYPE_LABEL,
} from "../utils/explore.js";
import TrailMap from "../components/TrailMap.jsx";
import Lightbox from "../components/Lightbox.jsx";
import TrailReport from "../components/TrailReport.jsx";
import { iconEmoji } from "../utils/exploreIcons.js";
import { usePageTitle } from "../utils/usePageTitle.js";
import "./Explore.css";

const FILTERS = [
  { key: "all", label: "全部" },
  { key: "food", label: "吃饭" },
  { key: "spot", label: "景点" },
];

// 把正文 HTML 压成一行纯文本，卡片上做三行截断
const plainText = (html) =>
  String(html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;|&#\d+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const pad2 = (n) => String(n).padStart(2, "0");
const yearOf = (r) => (r.date || "").slice(0, 4) || "未记日期";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// 数字滚动：从 0 滚到目标值，减弱动效偏好下直接显示终值
function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(target);
  const [reduced] = useState(prefersReducedMotion);
  useEffect(() => {
    if (reduced) return;
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduced]);
  return reduced ? target : val;
}

export default function Explore() {
  usePageTitle("探索 · 足迹");
  const [params, setParams] = useSearchParams();
  const [type, setType] = useState("all");
  const [activeSlug, setActiveSlug] = useState("");
  const [flashSlug, setFlashSlug] = useState("");
  const [lightbox, setLightbox] = useState(null); // { images, index, alt }
  const [reportOpen, setReportOpen] = useState(false);
  const flashTimer = useRef(null);

  // ?city= 同城筛选（详情页「同城胶囊」跳进来）
  const city = params.get("city") || "";

  const list = useMemo(() => {
    let l = type === "all" ? records : records.filter((r) => r.type === type);
    if (city) l = l.filter((r) => cityOf(r.place) === city);
    return l;
  }, [type, city]);
  const points = useMemo(() => list.filter((r) => r.hasGeo), [list]);

  const clearCity = () => {
    params.delete("city");
    setParams(params, { replace: true });
  };

  const stations = useCountUp(counts.all);
  const cities = useCountUp(cityCount);
  const km = useCountUp(totalKm);
  const photos = useCountUp(photoCount);

  // 地图 pin 点击：滚动定位到对应卡片并短暂高亮（hover 联动不走这里）
  const handlePinSelect = (slug) => {
    setActiveSlug(slug);
    setFlashSlug(slug);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashSlug(""), 1900);
    requestAnimationFrame(() => {
      document
        .querySelector(`[data-ex-card="${slug}"]`)
        ?.scrollIntoView({
          behavior: prefersReducedMotion() ? "auto" : "smooth",
          block: "center",
        });
    });
  };

  useEffect(() => () => clearTimeout(flashTimer.current), []);

  // 年份分节：当前筛选结果里出现多于一个年份时才插入年份分隔
  const showYears =
    new Set(list.map(yearOf)).size > 1;

  // 记录流渲染行：卡片之间按真实日期差插「间隔 N 天」贴纸
  const rows = useMemo(() => {
    const out = [];
    list.forEach((r, i) => {
      if (showYears && (i === 0 || yearOf(list[i - 1]) !== yearOf(r))) {
        out.push({ kind: "year", year: yearOf(r), i: out.length, key: `y-${yearOf(r)}-${r.slug}` });
      }
      out.push({ kind: "card", r, i: out.length, key: r.slug });
      const gap = gapDays(list[i + 1], r); // 列表最新在前，下一条是更早的一站
      if (gap) out.push({ kind: "gap", days: gap, i: out.length, key: `gap-${r.slug}` });
    });
    return out;
  }, [list, showYears]);

  return (
    <div className="container page page-explore">
      <header className="page-head">
        <span className="page-kicker">TRAIL · 足迹</span>
        <h1 className="page-title">探索</h1>
        <p className="page-subtitle">吃过的、走过的，都收进这本旅程册。</p>
      </header>

      <div className="ex-stats">
        <div className="ex-stat">
          <b>{stations}</b>
          <span>站足迹</span>
        </div>
        <div className="ex-stat">
          <b>{cities}</b>
          <span>座城市</span>
        </div>
        <div className="ex-stat">
          <b>{km}</b>
          <span>公里足迹</span>
        </div>
        <div className="ex-stat">
          <b>{photos}</b>
          <span>张照片</span>
        </div>
      </div>

      <div className="ex-toolbar">
        {city && (
          <span className="ex-city-filter">
            📍 {city}
            <button type="button" aria-label="清除同城筛选" onClick={clearCity}>
              ×
            </button>
          </span>
        )}
        <div className="filter-bar" role="tablist" aria-label="按类型筛选">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={f.key === type}
              className={`filter-chip${f.key === type ? " active" : ""}`}
              onClick={() => setType(f.key)}
            >
              {f.label}
              <em className="ex-chip-num">{f.key === "all" ? counts.all : counts[f.key]}</em>
            </button>
          ))}
        </div>

        <div className="ex-legend">
          <span className="ex-legend-item">
            <i className="ex-dot ex-dot-food" />
            吃饭
          </span>
          <span className="ex-legend-item">
            <i className="ex-dot ex-dot-spot" />
            景点
          </span>
          <span className="ex-legend-item">
            <i className="ex-dash" />
            按时间连成路线
          </span>
        </div>

        <button
          type="button"
          className="ex-btn ex-btn-ghost ex-report-entry"
          onClick={() => setReportOpen(true)}
        >
          📓 旅程报告
        </button>

        {import.meta.env.DEV && (
          <Link to="/explore/write" className="ex-btn ex-btn-primary ex-write-entry">
            ＋ 记一笔
          </Link>
        )}
      </div>

      <TrailMap points={points} activeSlug={activeSlug} onSelect={handlePinSelect} />

      <p className="ex-map-hint">
        图钉上的小图标是这一站的类型（可发布时自选），角标数字是时间顺序；点图钉会跳到对应那张「票根」，鼠标移到卡片上，地图也会跟着飞过去。
      </p>

      {list.length > 0 && (
        <div className="ex-section-title">
          <h2>记录流</h2>
          <span>最新在前 · 共 {list.length} 笔</span>
        </div>
      )}

      {list.length === 0 ? (
        <div className="ex-empty">
          <span className="ex-empty-mark">空</span>
          <p>
            {type === "all" ? "还没有任何记录" : `「${TYPE_LABEL[type]}」这一类还空着`}
          </p>
          <p className="ex-empty-hint">
            {import.meta.env.DEV ? "本地跑着 dev 服务时，点右上角「＋ 记一笔」" : "换个筛选看看"}
          </p>
        </div>
      ) : (
        <div className="ex-stream">
          {rows.map((row) => {
            if (row.kind === "year") {
              return (
                <div className="ex-year-div" key={row.key} style={{ "--i": row.i }}>
                  <i className="ex-year-dash" />
                  <span>{row.year}</span>
                  <i className="ex-year-dash" />
                </div>
              );
            }
            if (row.kind === "gap") {
              return (
                <div className="ex-gap-note" key={row.key} style={{ "--i": row.i }}>
                  <i className="ex-year-dash" />
                  <span>间隔 {row.days} 天</span>
                  <i className="ex-year-dash" />
                </div>
              );
            }

            const r = row.r;
            const txt = plainText(r.content);
            const imgs = r.images.slice(0, 9);
            return (
              <article
                key={r.slug}
                data-ex-card={r.slug}
                style={{
                  "--i": row.i,
                  ...(imgs.length ? { "--ex-cover": `url("${imgs[0]}")` } : {}),
                }}
                className={`ex-card ex-ticket ex-ticket-${r.type}${
                  imgs.length ? " has-cover" : ""
                }${r.slug === activeSlug ? " is-active" : ""}${
                  r.slug === flashSlug ? " is-flash" : ""
                }`}
                onMouseEnter={() => setActiveSlug(r.slug)}
                onMouseLeave={() => setActiveSlug("")}
              >
                {imgs.length > 0 && <span className="ex-ticket-bg" aria-hidden="true" />}
                <Link to={`/explore/${r.slug}`} className="ex-card-link">
                  <span className="ex-ticket-stub" aria-hidden="true">
                    <span className="ex-ticket-no">{pad2(r.no)}</span>
                    <span className="ex-ticket-stub-mark">{TYPE_LABEL[r.type]}</span>
                  </span>

                  <span className="ex-stamp" aria-hidden="true">
                    <time>{r.date}</time>
                    <em>NO.{pad2(r.no)}</em>
                  </span>

                  <div className="ex-ticket-face">
                    <div className="ex-card-head">
                      <span className={`ex-badge ex-badge-${r.type}`}>
                        {iconEmoji(r)} {TYPE_LABEL[r.type]}
                      </span>
                      <h2 className="ex-card-title">{r.title}</h2>
                    </div>

                    {txt && <p className="ex-card-text">{txt}</p>}

                    <div className="ex-card-foot">
                      <span className="ex-card-place">{r.place || "未标位置"}</span>
                      {!r.hasGeo && <span className="ex-card-nogeo">未记定位</span>}
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      )}

      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}

      {reportOpen && <TrailReport onClose={() => setReportOpen(false)} />}
    </div>
  );
}
