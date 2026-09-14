import "./SailLoader.css";

/* 懒加载占位：踏浪扬帆的小船（素材来自 Storyset，GIF/WebP 双份，浏览器优先取 WebP） */
export default function SailLoader({ text = "正在扬帆…" }) {
  return (
    <div className="sail-loader" role="status" aria-live="polite">
      <picture>
        <source srcSet="/sailing.webp" type="image/webp" />
        <img
          className="sail-loader-img"
          src="/sailing.gif"
          alt=""
          width="200"
          height="200"
          decoding="async"
        />
      </picture>
      <p className="sail-loader-text">{text}</p>
    </div>
  );
}
