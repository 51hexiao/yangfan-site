import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, NavLink, Link, useLocation } from "react-router-dom";
import Home from "./pages/Home.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import SailLoader from "./components/SailLoader.jsx";
import CommandPalette from "./components/CommandPalette.jsx";
import { posts } from "./utils/post.js";
import { counts, records } from "./utils/explore.js";

/* 懒加载并保证加载动画至少展示一小段时间，本地跳转也看得见 */
const withMinDelay = (load, ms = 420) =>
  Promise.all([load(), new Promise((r) => setTimeout(r, ms))]).then(([m]) => m);

const Blog = lazy(() => withMinDelay(() => import("./pages/Blog.jsx")));
const BlogPost = lazy(() => withMinDelay(() => import("./pages/BlogPost.jsx")));
const Archive = lazy(() => withMinDelay(() => import("./pages/Archive.jsx")));
const Collections = lazy(() => withMinDelay(() => import("./pages/Collections.jsx")));
const Explore = lazy(() => withMinDelay(() => import("./pages/Explore.jsx")));
const ExplorePost = lazy(() => withMinDelay(() => import("./pages/ExplorePost.jsx")));
const Projects = lazy(() => withMinDelay(() => import("./pages/Projects.jsx")));
const About = lazy(() => withMinDelay(() => import("./pages/About.jsx")));
// 写作台只存在于本地：生产构建不打包这两个页面（路由同样受 DEV 门控），上线后不可达
const Admin = import.meta.env.DEV ? lazy(() => import("./pages/Admin.jsx")) : null;
const ExploreWrite = import.meta.env.DEV ? lazy(() => import("./pages/ExploreWrite.jsx")) : null;

/* 站内跳转时帆船动画的展示时长（毫秒）——想多看一会儿就把它调大 */
const ROUTE_LOADER_MS = 1500;

/* React 19 + react-router v7 的站内导航走 transition，lazy 组件挂起时 React 保留旧界面、
   不渲染 Suspense fallback；这里用 location.key 自行判断「已跳转、未揭幕」，
   先把帆船动画铺满，展示满 ROUTE_LOADER_MS 毫秒后再揭幕新页面。 */
function useRouteLoader(ms) {
  const { key } = useLocation();
  const [revealedKey, setRevealedKey] = useState(key);

  useEffect(() => {
    if (revealedKey === key) return;
    const t = setTimeout(() => setRevealedKey(key), ms);
    return () => clearTimeout(t);
  }, [key, revealedKey, ms]);

  return revealedKey !== key;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const routeLoading = useRouteLoader(ROUTE_LOADER_MS);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // 全站唤起：Ctrl/⌘+K 或「/」（非输入框内）
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <ScrollToTop />
      <nav className="nav">
        <div className="container nav-inner">
          <Link to="/" className="nav-logo">
            肥仔妙妙屋
          </Link>
          <div className="nav-links">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              首页
            </NavLink>
            <NavLink
              to="/blog"
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              博客
            </NavLink>
            <NavLink
              to="/explore"
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              探索
            </NavLink>
            <NavLink
              to="/collections"
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              私藏
            </NavLink>
            <NavLink
              to="/projects"
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              作品集
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              关于我
            </NavLink>
            <button
              type="button"
              className="nav-search"
              title="全站搜索（Ctrl+K）"
              aria-label="全站搜索"
              onClick={() => setPaletteOpen(true)}
            >
              ⌕
            </button>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main>
        <Suspense fallback={<SailLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/explore/:slug" element={<ExplorePost />} />
            <Route path="/collections" element={<Collections />} />
            {import.meta.env.DEV && <Route path="/explore/write" element={<ExploreWrite />} />}
            <Route path="/projects" element={<Projects />} />
            <Route path="/about" element={<About />} />
            {import.meta.env.DEV && <Route path="/admin" element={<Admin />} />}
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </main>

      {routeLoading && (
        <div className="route-loader-overlay">
          <SailLoader />
        </div>
      )}

      <footer className="footer">
        <div className="container">
          © 2026 肥仔妙妙屋 · 用 React + Vite 构建
          <span className="footer-meta">
            {" · "}开张 {siteDays} 天 · 全站 {siteWords} 字 · {counts.all} 笔足迹
          </span>
          {import.meta.env.DEV && (
            <span className="footer-admin">
              {" · "}
              <Link to="/admin">写作</Link>
              {" · "}
              <Link to="/explore/write">记一笔</Link>
            </span>
          )}
        </div>
      </footer>

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
    </>
  );
}

// 页脚手账信息条：建站日取自项目创建日（2026-09-08），数字随时间自动增长
const SITE_BIRTH = "2026-09-08";
const siteDays = Math.max(1, Math.ceil((Date.now() - new Date(SITE_BIRTH)) / 86400000));
const plainLen = (html) => String(html ?? "").replace(/<[^>]+>/g, "").length;
const siteWords =
  posts.reduce((n, p) => n + plainLen(p.content), 0) +
  records.reduce((n, r) => n + plainLen(r.content), 0);
