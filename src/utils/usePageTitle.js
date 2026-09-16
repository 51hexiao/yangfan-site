import { useEffect } from "react";
import { profile } from "../data/profile.js";

const BASE = "肥仔妙妙屋";
const DEFAULT_TITLE = `${BASE} · ${profile.name}的手记、足迹与私藏`;

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

// 每页动态标题（+ 详情页的 OG 标签，分享出去有摘要卡）
export function usePageTitle(title, description) {
  useEffect(() => {
    document.title = title ? `${title} · ${BASE}` : DEFAULT_TITLE;
    if (title) setMeta("property", "og:title", `${title} · ${BASE}`);
    if (description) {
      setMeta("property", "og:description", description);
      setMeta("name", "description", description);
    }
  }, [title, description]);
}
