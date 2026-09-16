import { useEffect, useRef } from "react";
import "./HeroAvatar.css";

/**
 * 首页 Hero 头像展示区（仅首页使用）
 *
 * 层次：柔光底晕 → 外圈罗盘刻度环（缓转）→ 卫星光点 → 邮票虚线环
 *      → 奶油压边环 → 相纸白描边头像（网点纸 + 暗角 + 扫光）
 * 主题：光环与柔光取 --accent（color-mix 提亮），随 7 套主题自动切换；
 *      白色负责"相纸"对比，因 Hero 底色恒为深墨绿遮罩。
 * 交互：指针位置驱动 3D 轻倾 + 光晕跟随，离开即回正（rAF 节流）。
 *      触摸设备与 prefers-reduced-motion 下不挂载，由 CSS 兜底静态样式。
 * 安全：装饰层一律 pointer-events:none，不拦截首页链接与按钮点击。
 */
export default function HeroAvatar({
  src = `${import.meta.env.BASE_URL}avatar-hero-2.png`,
  alt = "头像",
}) {
  const wrapRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;

    // 只对"真能悬停"的精细指针启用，触摸与"减少动效"偏好直接跳过
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
    const calmMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!canHover.matches || calmMotion.matches) return undefined;

    const VARS = ["--hav-tilt-x", "--hav-tilt-y", "--hav-mx", "--hav-my"];
    let next = null;

    const paint = () => {
      rafRef.current = 0;
      if (!next) return;
      const { x, y } = next;
      el.style.setProperty("--hav-tilt-y", `${(x * 5.5).toFixed(2)}deg`);
      el.style.setProperty("--hav-tilt-x", `${(-y * 5.5).toFixed(2)}deg`);
      el.style.setProperty("--hav-mx", `${(((x + 1) / 2) * 100).toFixed(1)}%`);
      el.style.setProperty("--hav-my", `${(((y + 1) / 2) * 100).toFixed(1)}%`);
    };

    const onMove = (event) => {
      const box = el.getBoundingClientRect();
      if (!box.width || !box.height) return;
      next = {
        x: ((event.clientX - box.left) / box.width) * 2 - 1,
        y: ((event.clientY - box.top) / box.height) * 2 - 1,
      };
      if (!rafRef.current) rafRef.current = window.requestAnimationFrame(paint);
    };

    const reset = () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      next = null;
      VARS.forEach((name) => el.style.removeProperty(name));
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", reset);
    el.addEventListener("pointercancel", reset);

    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", reset);
      el.removeEventListener("pointercancel", reset);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      VARS.forEach((name) => el.style.removeProperty(name));
    };
  }, []);

  return (
    <div className="hero-avatar-wrap" ref={wrapRef}>
      <span className="hav-halo" aria-hidden="true" />
      <div className="hav-stage">
        <span className="hav-orbit hav-orbit--dial" aria-hidden="true" />
        <span className="hav-orbit hav-orbit--stamp" aria-hidden="true" />
        <span className="hav-orbit hav-orbit--paper" aria-hidden="true" />
        <span className="hav-satellite" aria-hidden="true" />
        <div className="hero-avatar">
          <img src={src} alt={alt} />
          <span className="hav-grain" aria-hidden="true" />
          <span className="hav-vignette" aria-hidden="true" />
          <span className="hav-sheen" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
