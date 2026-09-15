// marked 默认不消毒，Markdown 里手写的 <script>/on* 事件会原样输出。
// 内容虽然都是站长手写，但属纵深防御：万一有链路能把外部内容写进 md
// （比如被 CSRF 的写作接口），这里保证脚本不会在详情页落地。
// 只剥危险标签与事件属性，正常标签、图片、链接、代码块不受影响。

export function sanitizeHtml(html) {
  return String(html ?? "")
    // 成对的危险标签连内容一起删
    .replace(/<\s*(script|style|iframe|object|embed|form)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    // 未闭合的危险自闭合标签
    .replace(/<\s*\/?\s*(script|style|iframe|object|embed|form)\b[^>]*>/gi, "")
    // on* 事件属性（onclick/onerror/...）
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    // javascript: 伪协议链接
    .replace(/(\s(?:href|src)\s*=\s*)(["'])\s*javascript:[^"']*\2/gi, "$1$2")
    // srcdoc（iframe 已删，这里兜底）
    .replace(/\ssrcdoc\s*=\s*("[^"]*"|'[^']*')/gi, "");
}
