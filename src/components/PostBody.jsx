import { useEffect, useRef, useState } from "react";
import Lightbox from "./Lightbox.jsx";

// 正文渲染增强：图片点开灯箱、代码块加语言标签与复制按钮、外链新窗口
// html 由 marked 生成，这里只做 DOM 后处理，不改数据源
export default function PostBody({ html, className = "" }) {
  const ref = useRef(null);
  const [lb, setLb] = useState(null); // { srcs, idx }

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const cleanupFns = [];

    // 图片 → 灯箱
    const imgs = [...el.querySelectorAll("img")];
    imgs.forEach((img) => {
      img.loading = "lazy";
      img.style.cursor = "zoom-in";
      const onClick = () => setLb({ srcs: imgs.map((i) => i.currentSrc || i.src), idx: imgs.indexOf(img) });
      img.addEventListener("click", onClick);
      cleanupFns.push(() => img.removeEventListener("click", onClick));
    });

    // 代码块 → 语言标签 + 复制按钮
    el.querySelectorAll("pre").forEach((pre) => {
      if (pre.closest(".post-code")) return;
      const code = pre.querySelector("code");
      const lang = code?.className?.match(/language-([\w-]+)/)?.[1] ?? "code";

      const wrap = document.createElement("div");
      wrap.className = "post-code";
      const bar = document.createElement("div");
      bar.className = "post-code-bar";
      const tag = document.createElement("span");
      tag.textContent = lang;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "post-code-copy";
      btn.textContent = "复制";
      btn.addEventListener("click", async () => {
        const text = code?.innerText ?? pre.innerText;
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        btn.textContent = "已复制 ✓";
        setTimeout(() => (btn.textContent = "复制"), 1500);
      });
      bar.append(tag, btn);
      pre.parentNode.insertBefore(wrap, pre);
      wrap.append(bar, pre);
    });

    // 外链新窗口
    el.querySelectorAll('a[href^="http"]').forEach((a) => {
      a.target = "_blank";
      a.rel = "noreferrer noopener";
    });

    return () => cleanupFns.forEach((fn) => fn());
  }, [html]);

  return (
    <>
      <div ref={ref} className={className} dangerouslySetInnerHTML={{ __html: html }} />
      {lb && <Lightbox images={lb.srcs} index={lb.idx} onClose={() => setLb(null)} />}
    </>
  );
}
