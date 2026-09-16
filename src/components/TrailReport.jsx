import { useEffect, useMemo, useState } from "react";
import { cityOf, gapDays, pathKm, trail } from "../utils/explore.js";
import { profile } from "../data/profile.js";
import "./TrailReport.css";

// —— 汇总数据 ——
function buildReport(list) {
  if (!list.length) return null;

  const first = list[0];
  const last = list[list.length - 1];
  const spanDays = first.date && last.date
    ? Math.max(1, Math.round((new Date(last.date) - new Date(first.date)) / 86400000) + 1)
    : 0;

  // 城市排行
  const cityMap = new Map();
  list.forEach((r) => {
    const c = cityOf(r.place);
    if (c) cityMap.set(c, (cityMap.get(c) ?? 0) + 1);
  });
  const cities = [...cityMap.entries()].sort((a, b) => b[1] - a[1]);

  // 月份节奏
  const monthMap = new Map();
  list.forEach((r) => {
    if (r.date) {
      const m = r.date.slice(0, 7);
      monthMap.set(m, (monthMap.get(m) ?? 0) + 1);
    }
  });
  const months = [...monthMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  // 口味比例
  const foodN = list.filter((r) => r.type === "food").length;
  const foodPct = list.length ? Math.round((foodN / list.length) * 100) : 0;

  // 之最：最远一跳 / 间隔最久
  const geo = list.filter((r) => r.hasGeo);
  let farJump = null;
  for (let i = 1; i < geo.length; i++) {
    const km = Math.round(pathKm([geo[i - 1], geo[i]]));
    if (!farJump || km > farJump.km) {
      farJump = { km, from: geo[i - 1], to: geo[i] };
    }
  }
  let longGap = null;
  for (let i = 1; i < list.length; i++) {
    const gap = gapDays(list[i - 1], list[i]);
    if (gap && (!longGap || gap > longGap.days)) {
      longGap = { days: gap, from: list[i - 1], to: list[i] };
    }
  }

  return {
    spanDays,
    cities,
    months,
    foodPct,
    farJump,
    longGap,
    dateRange: first.date && last.date ? `${first.date} ~ ${last.date}` : "",
  };
}

// —— Canvas 手账海报 ——
function drawPoster(data) {
  const W = 1080;
  const H = 1620;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const INK = "#173f37";
  const CREAM = "#ffe9b3";
  const SOFT = "#8a8377";
  const font = (size, weight = 400) => `${weight} ${size}px "Microsoft YaHei", "PingFang SC", sans-serif`;

  // 纸面
  ctx.fillStyle = "#f6f2e7";
  ctx.fillRect(0, 0, W, H);

  // 双层手账框
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.strokeRect(44, 44, W - 88, H - 88);
  ctx.setLineDash([10, 8]);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(60, 60, W - 120, H - 120);
  ctx.setLineDash([]);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = SOFT;
  ctx.font = font(26);
  ctx.fillText("T R A I L   R E P O R T · 旅程手账", 100, 150);

  ctx.fillStyle = INK;
  ctx.font = font(84, 800);
  ctx.fillText("我的足迹报告", 96, 260);

  ctx.fillStyle = SOFT;
  ctx.font = font(28);
  ctx.fillText(data.dateRange, 100, 316);

  // 大数字（奶油荧光笔划线）
  const stats = [
    [String(data.stations), "站足迹"],
    [String(data.cities.length || 0), "座城市"],
    [`${data.totalKm}`, "公里"],
    [`${data.spanDays}`, "天"],
    [String(data.photos), "张照片"],
  ];
  let y = 430;
  stats.forEach(([num, label]) => {
    ctx.fillStyle = CREAM;
    ctx.fillRect(96, y - 62, 320, 74);
    ctx.fillStyle = INK;
    ctx.font = font(64, 800);
    ctx.fillText(num, 108, y);
    ctx.fillStyle = "#4a453c";
    ctx.font = font(32);
    ctx.fillText(label, 440, y);
    y += 110;
  });

  // 城市排行
  y += 20;
  ctx.fillStyle = SOFT;
  ctx.font = font(26);
  ctx.fillText("脚 步 分 布", 100, y);
  y += 52;
  ctx.fillStyle = "#4a453c";
  data.cities.slice(0, 5).forEach(([city, n]) => {
    ctx.font = font(32, 700);
    ctx.fillText(city, 100, y);
    ctx.font = font(28);
    ctx.fillStyle = SOFT;
    ctx.fillText(`× ${n}`, 480, y);
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = "#d8d2c2";
    ctx.beginPath();
    ctx.moveTo(100, y + 18);
    ctx.lineTo(W - 100, y + 18);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#4a453c";
    y += 74;
  });

  // 口味比例条
  y += 8;
  ctx.fillStyle = SOFT;
  ctx.font = font(26);
  ctx.fillText("口 味 比 例", 100, y);
  y += 44;
  const barW = W - 200;
  ctx.fillStyle = "#e3b23c";
  ctx.fillRect(100, y, (barW * data.foodPct) / 100, 34);
  ctx.fillStyle = INK;
  ctx.fillRect(100 + (barW * data.foodPct) / 100, y, (barW * (100 - data.foodPct)) / 100, 34);
  ctx.fillStyle = "#4a453c";
  ctx.font = font(26);
  ctx.fillText(`吃饭 ${data.foodPct}%`, 100, y + 76);
  ctx.fillText(`景点 ${100 - data.foodPct}%`, W - 100 - 120, y + 76);

  // 落款
  ctx.fillStyle = SOFT;
  ctx.font = font(26);
  const stamp = `${profile.sign} · ${new Date().toLocaleDateString("zh-CN")}`;
  ctx.fillText(stamp, W - 100 - ctx.measureText(stamp).width, H - 104);

  return canvas;
}

export default function TrailReport({ onClose }) {
  const [year, setYear] = useState("all");
  const years = [...new Set(trail.map((r) => (r.date || "").slice(0, 4)).filter(Boolean))].sort().reverse();

  const data = useMemo(() => {
    const list = year === "all" ? trail : trail.filter((r) => (r.date || "").startsWith(year));
    const base = buildReport(list);
    return base ? { ...base, stations: list.length, totalKm: Math.round(pathKm(list.filter((r) => r.hasGeo))), photos: list.reduce((n, r) => n + r.images.length, 0), cityCount: base.cities.length } : null;
  }, [year]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = old;
    };
  }, [onClose]);

  if (!data) {
    return (
      <div className="report-overlay" onClick={onClose}>
        <div className="report-sheet report-empty" onClick={(e) => e.stopPropagation()}>
          <span className="ex-empty-mark">空</span>
          <p>还没有任何记录，先去「记一笔」吧</p>
          <button type="button" className="ex-btn" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    );
  }

  const maxCity = data.cities[0]?.[1] ?? 1;
  const maxMonth = Math.max(...data.months.map(([, n]) => n), 1);

  const downloadPoster = () => {
    const canvas = drawPoster(data);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `旅程手账-${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
  };

  return (
    <div className="report-overlay" role="dialog" aria-modal="true" aria-label="旅程报告" onClick={onClose}>
      <div className="report-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="report-head">
          <span className="report-kicker">TRAIL REPORT · 旅程手账</span>
          <h2 className="report-title">我的足迹报告</h2>
          {data.dateRange && <span className="report-range">{data.dateRange}</span>}
        </header>

        {years.length > 1 && (
          <div className="report-tabs" role="tablist" aria-label="按年份查看">
            {["all", ...years].map((y) => (
              <button
                key={y}
                type="button"
                role="tab"
                aria-selected={year === y}
                className={`report-tab${year === y ? " active" : ""}`}
                onClick={() => setYear(y)}
              >
                {y === "all" ? "全部" : `${y} 年度`}
              </button>
            ))}
          </div>
        )}

        <div className="report-stats">
          <div className="report-stat"><b>{data.stations}</b><span>站足迹</span></div>
          <div className="report-stat"><b>{data.cities.length}</b><span>座城市</span></div>
          <div className="report-stat"><b>{data.totalKm}</b><span>公里</span></div>
          <div className="report-stat"><b>{data.spanDays}</b><span>天</span></div>
          <div className="report-stat"><b>{data.photos}</b><span>张照片</span></div>
        </div>

        {data.cities.length > 0 && (
          <section className="report-sec">
            <h3>脚步分布</h3>
            {data.cities.map(([city, n]) => (
              <div className="report-city" key={city}>
                <span className="report-city-name">{city}</span>
                <span className="report-city-bar">
                  <i style={{ width: `${Math.max(8, (n / maxCity) * 100)}%` }} />
                </span>
                <span className="report-city-n">× {n}</span>
              </div>
            ))}
          </section>
        )}

        {data.months.length > 0 && (
          <section className="report-sec">
            <h3>出行节奏</h3>
            <div className="report-months">
              {data.months.map(([m, n]) => (
                <div className="report-month" key={m}>
                  <i style={{ height: `${Math.max(10, (n / maxMonth) * 72)}px` }} title={`${m} · ${n} 笔`} />
                  <span>{m.slice(5)}月</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="report-sec">
          <h3>口味比例</h3>
          <div className="report-taste">
            <i className="report-taste-food" style={{ width: `${data.foodPct}%` }} />
            <i className="report-taste-spot" style={{ width: `${100 - data.foodPct}%` }} />
          </div>
          <div className="report-taste-label">
            <span>🍜 吃饭 {data.foodPct}%</span>
            <span>🏞️ 景点 {100 - data.foodPct}%</span>
          </div>
        </section>

        {(data.farJump || data.longGap) && (
          <section className="report-sec">
            <h3>本程之最</h3>
            {data.farJump && (
              <p className="report-best">
                🧭 最远的一跳：
                {data.farJump.from.title} → {data.farJump.to.title}，直线 {data.farJump.km} 公里
              </p>
            )}
            {data.longGap && (
              <p className="report-best">
                ⏳ 间隔最久：
                {data.longGap.from.title} 之后隔了 {data.longGap.days} 天才到 {data.longGap.to.title}
              </p>
            )}
          </section>
        )}

        <footer className="report-foot">
          <span className="report-sign">{profile.sign}</span>
          <div className="report-actions">
            <button type="button" className="ex-btn ex-btn-primary" onClick={downloadPoster}>
              📸 下载海报 PNG
            </button>
            <button type="button" className="ex-btn ex-btn-ghost" onClick={onClose}>
              关闭
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
