import { useEffect, useRef, useState } from "react";
import "./CursorGlow.css";

/* 首页 Hero 的鼠标光效：一团跟手的柔光 + 两圈光圈 + 走位时甩出的涟漪。
   设计取舍（都收在"克制"这一条下）：
   ① 挂在 .hero 内部、z-index 低于正文容器 —— 光永远在文字后面，不盖字、不抢读；
   ② 颜色不写死，取主题令牌 --accent 与白色混合，7 套配色自动换色；
   ③ 只在首页引用（Home.jsx），随路由卸载，其它页面不受影响；
   ④ 触摸设备、以及系统开了"减少动态效果"时直接不渲染；
   ⑤ rAF 只在指针移动/页面滚动时跑，停住即关，不空转吃 CPU。 */

const HALO_LERP = 0.09; // 柔光跟随速度（越小越拖尾）
const FAR_LERP = 0.14; // 外圈光圈
const NEAR_LERP = 0.22; // 内圈光圈（最跟手）
const RIPPLE_STEP = 130; // 指针每走这么远甩出一圈涟漪
const RIPPLE_GAP = 240; // 两圈涟漪的最小间隔（毫秒）
const SETTLE = 0.25; // 差这么点像素就算到位，到位即停 rAF
const MAX_NODES = 11; // 3 个光层 + 最多 8 圈涟漪，封顶防 DOM 无限增长

export default function CursorGlow() {
  const rootRef = useRef(null);
  const haloRef = useRef(null);
  const farRef = useRef(null);
  const nearRef = useRef(null);

  // 触摸设备没有"悬浮"，系统要求减弱动效时不打扰
  const [enabled] = useState(
    () =>
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    if (!enabled) return;
    const root = rootRef.current;
    const halo = haloRef.current;
    const far = farRef.current;
    const near = nearRef.current;
    if (!root || !halo || !far || !near) return;

    const host = root.parentElement ?? root; // .hero
    let raf = 0;
    let seen = false; // 指针是否进过 hero
    let lastRippleAt = 0;
    const target = { x: 0, y: 0 }; // 指针在 hero 内的目标点
    const anchor = { x: 0, y: 0 }; // 上一圈涟漪的落点
    const haloPos = { x: 0, y: 0 };
    const farPos = { x: 0, y: 0 };
    const nearPos = { x: 0, y: 0 };

    const place = (el, p) => {
      el.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0)`;
    };

    const addRipple = (x, y, big) => {
      const now = performance.now();
      if (!big && now - lastRippleAt < RIPPLE_GAP) return;
      if (root.childElementCount >= MAX_NODES) return;
      lastRippleAt = now;
      const el = document.createElement("span");
      el.className = big ? "cursor-glow-ripple is-big" : "cursor-glow-ripple";
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      el.addEventListener("animationend", () => el.remove(), { once: true });
      root.appendChild(el);
      // 兜底：万一动效事件没派发（窗口被切走等），也别让节点堆着
      window.setTimeout(() => el.remove(), 2600);
    };

    const frame = () => {
      raf = 0;
      const rect = root.getBoundingClientRect();
      const tx = target.x - rect.left;
      const ty = target.y - rect.top;

      haloPos.x += (tx - haloPos.x) * HALO_LERP;
      haloPos.y += (ty - haloPos.y) * HALO_LERP;
      farPos.x += (tx - farPos.x) * FAR_LERP;
      farPos.y += (ty - farPos.y) * FAR_LERP;
      nearPos.x += (tx - nearPos.x) * NEAR_LERP;
      nearPos.y += (ty - nearPos.y) * NEAR_LERP;
      place(halo, haloPos);
      place(far, farPos);
      place(near, nearPos);

      // 每走一段路，在原地留一圈扩散的涟漪
      if (Math.hypot(tx - anchor.x, ty - anchor.y) >= RIPPLE_STEP) {
        anchor.x = tx;
        anchor.y = ty;
        addRipple(tx, ty, false);
      }

      const settled =
        Math.abs(tx - haloPos.x) < SETTLE &&
        Math.abs(ty - haloPos.y) < SETTLE &&
        Math.abs(tx - nearPos.x) < SETTLE &&
        Math.abs(ty - nearPos.y) < SETTLE;
      if (!settled) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onMove = (e) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (!seen) {
        // 首次进入：直接落位，避免从上一个位置"飞"过来
        seen = true;
        const rect = root.getBoundingClientRect();
        haloPos.x = farPos.x = nearPos.x = target.x - rect.left;
        haloPos.y = farPos.y = nearPos.y = target.y - rect.top;
        anchor.x = haloPos.x;
        anchor.y = haloPos.y;
        root.classList.add("is-live");
      }
      start();
    };

    const onDown = (e) => {
      const rect = root.getBoundingClientRect();
      addRipple(e.clientX - rect.left, e.clientY - rect.top, true);
    };

    const onLeave = () => {
      seen = false;
      root.classList.remove("is-live");
    };

    // 页面滚动会改变指针在 hero 内的相对位置，重新拉一次让光跟住
    const onScroll = () => {
      if (seen) start();
    };

    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerdown", onDown, { passive: true });
    host.addEventListener("pointerleave", onLeave, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      root.replaceChildren(); // 清掉还在动的涟漪
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="cursor-glow" ref={rootRef} aria-hidden="true">
      <div className="cursor-glow-halo" ref={haloRef} />
      <div className="cursor-glow-ring cursor-glow-ring-far" ref={farRef} />
      <div className="cursor-glow-ring cursor-glow-ring-near" ref={nearRef} />
    </div>
  );
}
