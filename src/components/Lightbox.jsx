import { useCallback, useEffect, useState } from "react";
import "./Lightbox.css";

// 全站可复用的图片灯箱：props { images, index, alt, onClose }。
// 键盘 ←/→ 切换、Esc 关闭；点遮罩关、点图不关；打开期间锁 body 滚动。
export default function Lightbox({ images = [], index = 0, alt = "", onClose }) {
  const [cur, setCur] = useState(index);
  const total = images.length;

  const prev = useCallback(() => setCur((i) => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setCur((i) => (i + 1) % total), [total]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      else if (e.key === "ArrowLeft" && total > 1) prev();
      else if (e.key === "ArrowRight" && total > 1) next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next, total]);

  useEffect(() => {
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
    };
  }, []);

  if (total === 0) return null;

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="查看大图"
      onClick={onClose}
    >
      <div className="lightbox-inner">
        {total > 1 && (
          <button
            type="button"
            className="lightbox-arrow lightbox-arrow-prev"
            aria-label="上一张"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
          >
            ←
          </button>
        )}

        <figure className="lightbox-stage" onClick={(e) => e.stopPropagation()}>
          <img src={images[cur]} alt={alt} />
          <figcaption className="lightbox-caption">
            {alt && <span className="lightbox-alt">{alt}</span>}
            {total > 1 && (
              <span className="lightbox-count">
                {cur + 1} / {total}
              </span>
            )}
          </figcaption>
        </figure>

        {total > 1 && (
          <button
            type="button"
            className="lightbox-arrow lightbox-arrow-next"
            aria-label="下一张"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
          >
            →
          </button>
        )}
      </div>

      <button
        type="button"
        className="lightbox-close"
        aria-label="关闭"
        onClick={(e) => {
          e.stopPropagation();
          onClose?.();
        }}
      >
        ×
      </button>
    </div>
  );
}
