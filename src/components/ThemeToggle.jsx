import { useEffect, useRef, useState } from "react";
import { DEFAULT_THEME_ID, THEMES, getThemeById } from "../data/themes.js";
import "./ThemeToggle.css";

const STORAGE_KEY = "theme";

function resolveInitialTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (getThemeById(saved)) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : DEFAULT_THEME_ID;
}

export default function ThemeToggle() {
  const [themeId, setThemeId] = useState(resolveInitialTheme);
  const [open, setOpen] = useState(false);
  const pickerRef = useRef(null);

  const theme = getThemeById(themeId) ?? getThemeById(DEFAULT_THEME_ID);

  useEffect(() => {
    document.documentElement.dataset.theme = theme.id;
    document.documentElement.dataset.mode = theme.mode;
    localStorage.setItem(STORAGE_KEY, theme.id);
  }, [theme]);

  /* 点面板外面或按 Esc 关闭 */
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e) => {
      if (!pickerRef.current?.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="theme-picker" ref={pickerRef}>
      <button
        className="theme-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label="切换主题配色"
        aria-haspopup="listbox"
        aria-expanded={open}
        title={`配色：${theme.name}`}
      >
        <span className="theme-toggle-swatch" aria-hidden="true">
          <i style={{ background: theme.swatch[0] }} />
          <i style={{ background: theme.swatch[1] }} />
        </span>
      </button>

      {open && (
        <div className="theme-menu" role="listbox" aria-label="主题配色">
          <p className="theme-menu-title">配色</p>
          {THEMES.map((item) => {
            const active = item.id === theme.id;
            return (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={active}
                className={`theme-option${active ? " active" : ""}`}
                onClick={() => {
                  setThemeId(item.id);
                  setOpen(false);
                }}
              >
                <span className="theme-swatch" aria-hidden="true">
                  <i style={{ background: item.swatch[0] }} />
                  <i style={{ background: item.swatch[1] }} />
                </span>
                <span className="theme-option-text">
                  <span className="theme-option-name">{item.name}</span>
                  <span className="theme-option-note">{item.note}</span>
                </span>
                <span className="theme-option-check" aria-hidden="true">
                  {active ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
