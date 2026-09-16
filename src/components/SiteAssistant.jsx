import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { THEMES } from "../data/themes.js";
import { personaText } from "../data/profile.js";
import {
  findContent,
  labelOfPath,
  parseActions,
  resolveModeTheme,
  resolvePath,
  resolveTheme,
  searchSite,
  siteContextText,
} from "../utils/assistantActions.js";
import "./SiteAssistant.css";

/* 配置只落在本机 localStorage，键名与构建产物无关；代码里不出现任何密钥 */
const CONFIG_KEY = "mmw-assistant-config";
const HISTORY_KEY = "mmw-assistant-history"; // 对话历史存 sessionStorage：标签页内保留，刷新不丢、关页即清
const THEME_EVENT = "mmw:theme-change";
const OPEN_PALETTE_EVENT = "mmw:open-palette";
const REQUEST_TIMEOUT = 45000;
const MAX_HISTORY = 16; // 每次最多带 16 条上下文，省 token 也防跑偏

const DEFAULT_CONFIG = {
  baseUrl: "https://api.deepseek.com/v1",
  model: "deepseek-chat",
  key: "",
};

const PROVIDERS = [
  ["DeepSeek", "https://api.deepseek.com/v1"],
  ["OpenAI", "https://api.openai.com/v1"],
  ["通义千问", "https://dashscope.aliyuncs.com/compatible-mode/v1"],
  ["Moonshot", "https://api.moonshot.cn/v1"],
];

const GREETING_CHIPS = [
  "杨帆是谁？",
  "坐船去足迹地图",
  "换个深色主题",
  "站里都写了些什么？",
];

let seq = 0;
const mk = (role, text, extra = {}) => ({ id: `m${++seq}`, role, text, ...extra });

const HISTORY_MAX = 40; // 本地最多留 40 条，够回看也不撑爆存储

function loadHistory() {
  try {
    const raw = JSON.parse(sessionStorage.getItem(HISTORY_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((m) => m && typeof m.text === "string" && (m.role === "user" || m.role === "assistant" || m.role === "error"))
      .slice(-HISTORY_MAX);
  } catch {
    return [];
  }
}

function loadConfig() {
  try {
    const raw = JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}");
    return {
      baseUrl: typeof raw.baseUrl === "string" && raw.baseUrl ? raw.baseUrl : DEFAULT_CONFIG.baseUrl,
      model: typeof raw.model === "string" && raw.model ? raw.model : DEFAULT_CONFIG.model,
      key: typeof raw.key === "string" ? raw.key : "",
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

const isConfigured = (config) => Boolean(config.key.trim() && config.baseUrl.trim());

function describeHttpError(status) {
  if (status === 401) return "密钥无效或已过期（401），去设置里核对一下 API Key。";
  if (status === 403) return "这个密钥没有访问权限（403），或服务商限制了来源域名。";
  if (status === 404) return "接口地址或模型名不对（404），检查一下 baseUrl 与 model。";
  if (status === 429) return "请求太频繁或额度用尽（429），歇一会儿再试。";
  if (status >= 500) return `模型服务暂时不可用（${status}），稍后再试。`;
  return `请求失败（${status}）。`;
}

async function requestChat(config, messages, signal, extra = {}) {
  const base = config.baseUrl.trim().replace(/\/+$/, "");
  const url = /\/chat\/completions$/.test(base) ? base : `${base}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.key.trim()}`,
    },
    body: JSON.stringify({
      model: config.model.trim(),
      messages,
      temperature: 0.3,
      stream: false,
      ...extra,
    }),
    signal,
  });
  if (!res.ok) throw new Error(describeHttpError(res.status));
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error("模型这次没返回内容，换个说法再问一次。");
  return text.trim();
}

function buildSystemPrompt(pathname) {
  return [
    "你是「船夫」，个人小站「肥仔妙妙屋」里常驻的管家——和站长杨帆一起长大的搭子，替他看着这条船。",
    personaText(),
    "只用中文回答，通常不超过 80 字（用户要求展开才详细说）；像在手账页边写批注，不寒暄不铺垫。",
    "你只能通过下面的动作指令操作网页；页面、文章清单以外的内容一律不许编造。",
    "",
    "【输出格式】需要操作网页时，在回答的最后另起一行写动作指令：@@ACT {\"type\":\"...\"}@@",
    "一轮最多两个动作；没把握就不要输出动作，只用文字回答。动作执行后系统会把结果告诉你，你再用一句话回应。",
    "",
    "【可用动作】",
    '1. 站内跳转：{"type":"navigate","path":"/blog"}',
    '2. 打开文章：{"type":"openPost","title":"文章标题"}（也可用 {"slug":"..."}）',
    '3. 站内检索：{"type":"search","query":"关键词"}',
    '4. 切换配色：{"type":"setTheme","theme":"主题id或中文名"}',
    '5. 切换深浅色：{"type":"setMode","mode":"light"} 或 {"type":"setMode","mode":"dark"}',
    '6. 打开站内搜索面板：{"type":"openPalette"}',
    "",
    siteContextText(),
    "",
    `【用户此刻所在页面】${pathname}`,
  ].join("\n");
}

export default function SiteAssistant() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState("chat"); // chat | config
  const [config, setConfig] = useState(loadConfig);
  const [draft, setDraft] = useState(() => loadConfig());
  const [showKey, setShowKey] = useState(false);
  const [messages, setMessages] = useState(loadHistory);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [configNote, setConfigNote] = useState("");

  const abortRef = useRef(null);
  const threadRef = useRef(null);
  const inputRef = useRef(null);
  const tabRef = useRef(null);
  const fabRef = useRef(null);

  const configured = isConfigured(config);

  /* 新消息或思考中，滚到底 */
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy, open, view]);

  /* 对话历史写 sessionStorage（错误提示也留，方便回看上下文） */
  useEffect(() => {
    try {
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-HISTORY_MAX)));
    } catch {
      /* 存储满就算了，对话还能用 */
    }
  }, [messages]);

  /* 展开后把焦点交给输入框，键盘用户不用再 Tab 一路找 */
  useEffect(() => {
    if (open && view === "chat") inputRef.current?.focus();
  }, [open, view]);

  const refocusTrigger = useCallback(() => {
    const el = window.matchMedia("(min-width: 1280px)").matches ? tabRef.current : fabRef.current;
    el?.focus();
  }, []);

  const closePanel = useCallback(() => {
    abortRef.current?.abort();
    setOpen(false);
    setView("chat");
    requestAnimationFrame(refocusTrigger);
  }, [refocusTrigger]);

  /* ---------- 受控执行：只认白名单动作 ---------- */

  const applyTheme = useCallback((theme) => {
    document.documentElement.dataset.theme = theme.id;
    document.documentElement.dataset.mode = theme.mode;
    localStorage.setItem("theme", theme.id);
    // 广播出去，导航栏的主题选择器同步高亮（见 ThemeToggle.jsx）
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme.id }));
  }, []);

  const runAction = useCallback(
    (action) => {
      try {
        switch (action.type) {
          case "navigate": {
            const path = resolvePath(action.path ?? action.to ?? action.page);
            if (!path) return { note: `站里没有「${action.path ?? "这个地址"}」这个页面，我没动。` };
            navigate(path);
            return { note: `已打开${labelOfPath(path)}（${path}）` };
          }
          case "openPost": {
            const q = String(action.title ?? action.slug ?? action.name ?? "").trim();
            const hit = findContent(q);
            if (hit) {
              navigate(hit.path);
              return { note: `已打开《${hit.title}》` };
            }
            const near = searchSite(q, 4);
            if (near.length) {
              navigate(near[0].path);
              return {
                note: `没找到《${q}》，先打开最接近的《${near[0].title}》；下面是还沾边的几条：`,
                items: near,
              };
            }
            return { note: `站里没有《${q}》这篇，换个标题试试？` };
          }
          case "search": {
            const q = String(action.query ?? action.keyword ?? action.q ?? "").trim();
            const hits = searchSite(q, 5);
            if (!hits.length) return { note: `站里没搜到和「${q}」相关的内容。` };
            return { note: `站内找到 ${hits.length} 条和「${q}」相关的：`, items: hits };
          }
          case "setTheme": {
            const theme = resolveTheme(action.theme ?? action.id ?? action.name);
            if (!theme)
              return { note: `没有叫「${action.theme ?? ""}」的配色，现有：${THEMES.map((t) => t.name).join("、")}` };
            applyTheme(theme);
            return { note: `配色已切到「${theme.name}」` };
          }
          case "setMode": {
            const theme = resolveModeTheme(action.mode ?? action.value);
            if (!theme) return { note: "没听懂要浅色还是深色，" + `${action.mode ?? ""}`.trim() };
            applyTheme(theme);
            return { note: `已切到${theme.mode === "dark" ? "深色" : "浅色"}「${theme.name}」` };
          }
          case "openPalette": {
            abortRef.current?.abort();
            setOpen(false);
            setView("chat");
            window.dispatchEvent(new Event(OPEN_PALETTE_EVENT));
            return { note: "已打开站内搜索面板" };
          }
          default:
            return { note: `不认识的动作「${action.type ?? "空"}」，已忽略。` };
        }
      } catch (err) {
        return { note: `动作没能执行：${err?.message ?? "未知原因"}` };
      }
    },
    [applyTheme, navigate],
  );

  /* ---------- 一轮问答 ---------- */

  const toApiMessages = (list) =>
    list.slice(-MAX_HISTORY).map((m) =>
      m.role === "hint" ? { role: "system", content: `【站内动作结果】${m.text}` } : { role: m.role, content: m.text },
    );

  const send = useCallback(
    async (raw) => {
      const text = String(raw ?? "").trim();
      if (!text || busy) return;

      if (!configured) {
        setView("config");
        setMessages((prev) => [...prev, mk("error", "还没配置模型接口，先点右上角齿轮填上接口地址和 API Key。")]);
        return;
      }

      let conv = [...messages, mk("user", text)];
      setMessages(conv);
      setInput("");
      setBusy(true);
      if (inputRef.current) inputRef.current.style.height = "auto";

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        ctrl.abort();
      }, REQUEST_TIMEOUT);

      try {
        for (let round = 0; round < 2; round++) {
          const system =
            buildSystemPrompt(pathname) +
            (round > 0
              ? "\n\n【提醒】上面的站内动作已经执行完了，现在直接用一两句中文回应即可，不要再输出 @@ACT@@ 指令。"
              : "");
          const reply = await requestChat(config, [{ role: "system", content: system }, ...toApiMessages(conv)], ctrl.signal);
          const { text: visible, actions } = parseActions(reply);

          if (visible) {
            conv = [...conv, mk("assistant", visible)];
            setMessages(conv);
          }

          if (!actions.length) {
            if (!visible) {
              conv = [...conv, mk("assistant", "这次没说出话来，换个问法再试试？")];
              setMessages(conv);
            }
            break;
          }

          for (const action of actions) {
            const receipt = runAction(action);
            conv = [...conv, mk("hint", receipt.note, { items: receipt.items })];
            setMessages(conv);
          }
        }
      } catch (err) {
        if (err?.name === "AbortError") {
          if (timedOut) {
            setMessages((prev) => [...prev, mk("error", "等了 45 秒还没等到回复，网络或服务商有点慢，再发一次试试。")]);
          }
        } else {
          const msg = err?.message ?? "请求失败。";
          setMessages((prev) => [...prev, mk("error", `${msg}（可以直接再发一次重试）`)]);
        }
      } finally {
        clearTimeout(timer);
        abortRef.current = null;
        setBusy(false);
      }
    },
    [busy, config, configured, messages, pathname, runAction],
  );

  /* ---------- 键盘 ---------- */

  const onPanelKeyDown = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      closePanel();
    }
  };

  const onInputKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  };

  const autoGrow = (e) => {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 118)}px`;
  };

  /* ---------- 配置视图动作 ---------- */

  const saveConfig = () => {
    const next = {
      baseUrl: draft.baseUrl.trim().replace(/\/+$/, ""),
      model: draft.model.trim() || DEFAULT_CONFIG.model,
      key: draft.key.trim(),
    };
    if (!/^https?:\/\//i.test(next.baseUrl)) {
      setConfigNote("接口地址要以 http:// 或 https:// 开头。");
      return;
    }
    if (!next.key) {
      setConfigNote("API Key 不能为空。");
      return;
    }
    localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
    setConfig(next);
    setConfigNote("");
    setView("chat");
  };

  const clearConfig = () => {
    localStorage.removeItem(CONFIG_KEY);
    const empty = { ...DEFAULT_CONFIG };
    setConfig(empty);
    setDraft(empty);
    setConfigNote("已从本机清除，页面上不再保留任何密钥。");
  };

  const testConnection = async () => {
    const probe = {
      baseUrl: draft.baseUrl.trim().replace(/\/+$/, ""),
      model: draft.model.trim() || DEFAULT_CONFIG.model,
      key: draft.key.trim(),
    };
    if (!/^https?:\/\//i.test(probe.baseUrl) || !probe.key) {
      setConfigNote("先把接口地址和 API Key 填完整再测。");
      return;
    }
    setTesting(true);
    setConfigNote("");
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      const reply = await requestChat(
        probe,
        [{ role: "user", content: "只回复两个字：在的" }],
        ctrl.signal,
        { max_tokens: 16 },
      );
      clearTimeout(timer);
      setConfigNote(`连接正常，模型回了：${reply.slice(0, 20)}`);
    } catch (err) {
      setConfigNote(
        err?.name === "AbortError"
          ? "测试超时，检查网络或接口地址（也可能是浏览器直连被 CORS 拦了）。"
          : `测试失败：${err?.message ?? "未知错误"}`,
      );
    } finally {
      setTesting(false);
    }
  };

  /* ---------- 渲染 ---------- */

  const renderThread = () => {
    if (!messages.length) {
      return (
        <div className="mmw-ai-empty">
          <p>{configured ? "船在这儿。想逛哪儿、想搜什么，说一声。" : "还没接上模型，配好接口和密钥我就能干活了。"}</p>
          {configured ? (
            <>
              <small>我能帮你翻站内文章、跳页面、换配色深浅，也能陪你聊两句。</small>
              <div className="mmw-ai-chips">
                {GREETING_CHIPS.map((chip) => (
                  <button key={chip} type="button" className="mmw-ai-chip" onClick={() => send(chip)}>
                    {chip}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <small>密钥只保存在这台电脑的浏览器里，不会进代码仓库，也不会出现在构建产物中。</small>
              <div className="mmw-ai-chips">
                <button type="button" className="mmw-ai-chip" onClick={() => setView("config")}>
                  去填接口与密钥
                </button>
              </div>
            </>
          )}
        </div>
      );
    }

    return messages.map((m) => {
      if (m.role === "hint") {
        return (
          <div className="mmw-ai-receipt" key={m.id}>
            <div className="mmw-ai-receipt-line">
              <span>{m.text}</span>
            </div>
            {m.items?.length ? (
              <div className="mmw-ai-hits">
                {m.items.map((it, i) => (
                  <button
                    key={`${it.path}-${i}`}
                    type="button"
                    className="mmw-ai-item"
                    onClick={() => navigate(it.path)}
                    title={`打开 ${it.path}`}
                  >
                    <span className="mmw-ai-item-kind">{it.kind}</span>
                    <span className="mmw-ai-item-title">{it.title}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        );
      }
      return (
        <div className={`mmw-ai-msg is-${m.role}`} key={m.id}>
          {m.text}
        </div>
      );
    });
  };

  return (
    <div className="mmw-ai">
      {!open && (
        <>
          <button
            type="button"
            ref={tabRef}
            className="mmw-ai-tab"
            onClick={() => setOpen(true)}
            aria-expanded={false}
            aria-label="打开站内小管家"
            title="站内小管家"
          >
            <span className="mmw-ai-tab-mark" aria-hidden="true">
              ✦
            </span>
            <span>小管家</span>
          </button>
          <button
            type="button"
            ref={fabRef}
            className="mmw-ai-fab"
            onClick={() => setOpen(true)}
            aria-expanded={false}
            aria-label="打开站内小管家"
            title="站内小管家"
          >
            <span aria-hidden="true">✦</span>
          </button>
        </>
      )}

      {open && (
        <section
          className="mmw-ai-panel"
          role="dialog"
          aria-label="站内小管家"
          aria-modal="false"
          onKeyDown={onPanelKeyDown}
        >
          <header className="mmw-ai-head">
            <span className={`mmw-ai-dot${configured ? "" : " is-off"}`} aria-hidden="true" />
            <div className="mmw-ai-title">
              <strong>船夫</strong>
              <span>{view === "config" ? "设置" : configured ? config.model : "未配置"}</span>
            </div>
            {view === "chat" && messages.length > 0 && (
              <button
                type="button"
                className="mmw-ai-icon-btn"
                onClick={() => setMessages([])}
                aria-label="清空对话"
                title="清空对话"
              >
                ⌫
              </button>
            )}
            <button
              type="button"
              className={`mmw-ai-icon-btn${view === "config" ? " is-on" : ""}`}
              onClick={() => {
                setConfigNote("");
                setDraft(config);
                setView((v) => (v === "config" ? "chat" : "config"));
              }}
              aria-label={view === "config" ? "返回对话" : "打开设置"}
              title={view === "config" ? "返回对话" : "设置"}
            >
              {view === "config" ? "←" : "⚙"}
            </button>
            <button type="button" className="mmw-ai-close" onClick={closePanel} aria-label="收起小管家" title="收起（Esc）">
              ✕
            </button>
          </header>

          {view === "config" ? (
            <div className="mmw-ai-config">
              <div className="mmw-ai-field">
                <label htmlFor="mmw-ai-base">接口地址（兼容 OpenAI 格式）</label>
                <input
                  id="mmw-ai-base"
                  type="text"
                  value={draft.baseUrl}
                  spellCheck={false}
                  placeholder={DEFAULT_CONFIG.baseUrl}
                  onChange={(e) => setDraft((d) => ({ ...d, baseUrl: e.target.value }))}
                />
              </div>
              <div className="mmw-ai-field">
                <label htmlFor="mmw-ai-model">模型名</label>
                <input
                  id="mmw-ai-model"
                  type="text"
                  value={draft.model}
                  spellCheck={false}
                  placeholder={DEFAULT_CONFIG.model}
                  onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value }))}
                />
              </div>
              <div className="mmw-ai-field">
                <label htmlFor="mmw-ai-key">API Key</label>
                <div className="mmw-ai-key-row">
                  <input
                    id="mmw-ai-key"
                    type={showKey ? "text" : "password"}
                    value={draft.key}
                    spellCheck={false}
                    autoComplete="off"
                    placeholder="sk-..."
                    onChange={(e) => setDraft((d) => ({ ...d, key: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="mmw-ai-icon-btn"
                    onClick={() => setShowKey((v) => !v)}
                    aria-label={showKey ? "隐藏密钥" : "显示密钥"}
                    title={showKey ? "隐藏密钥" : "显示密钥"}
                  >
                    {showKey ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              <p className="mmw-ai-note">
                <strong>只存本机</strong>：密钥写在浏览器 localStorage 里，请求由页面直连你填的服务商；代码仓库与构建产物里
                <strong>不含任何密钥</strong>，换台电脑需要重新填。
                常用地址：{PROVIDERS.map(([name, url]) => `${name} ${url}`).join("；")}。
              </p>

              {configNote && <p className="mmw-ai-note">{configNote}</p>}

              <div className="mmw-ai-actions">
                <button type="button" className="mmw-ai-btn is-primary" onClick={saveConfig}>
                  保存并使用
                </button>
                <button type="button" className="mmw-ai-btn" onClick={testConnection} disabled={testing}>
                  {testing ? "测试中…" : "测试连接"}
                </button>
              </div>
              <button type="button" className="mmw-ai-btn" onClick={clearConfig}>
                清除本机密钥
              </button>
            </div>
          ) : (
            <>
              <div className="mmw-ai-thread" ref={threadRef} role="log" aria-live="polite" aria-label="与小管家的对话">
                {renderThread()}
                {busy && (
                  <div className="mmw-ai-thinking">
                    <span className="mmw-ai-dots" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                    <span>小管家正在翻本站的目录…</span>
                  </div>
                )}
              </div>

              <form
                className="mmw-ai-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
              >
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onInput={autoGrow}
                  onKeyDown={onInputKeyDown}
                  placeholder="问点什么，或让我做点站内的事…"
                  aria-label="给小管家发消息"
                />
                <button
                  type="button"
                  className="mmw-ai-send"
                  onClick={() => (busy ? abortRef.current?.abort() : send(input))}
                  disabled={!busy && !input.trim()}
                  aria-label={busy ? "停止生成" : "发送"}
                  title={busy ? "停止生成" : "发送（Enter）"}
                >
                  {busy ? "■" : "↑"}
                </button>
              </form>

              <div className="mmw-ai-foot">
                <span>
                  <kbd>Enter</kbd> 发送 · <kbd>Shift</kbd>+<kbd>Enter</kbd> 换行 · <kbd>Esc</kbd> 收起
                </span>
                <span>{configured ? "内容由你配置的模型生成" : "尚未配置模型"}</span>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

export { CONFIG_KEY, THEME_EVENT, OPEN_PALETTE_EVENT };
