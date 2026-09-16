// 分享海报：把一篇文章/一笔足迹画成手账风分享图（1080×1440），纯 canvas 零依赖
// 内容统一走「kicker + 标题（自动换行）+ 摘要（自动换行）+ 信息行 + 落款」结构

import { profile } from "../data/profile.js";

const W = 1080;
const H = 1440;
const INK = "#173f37";
const CREAM = "#ffe9b3";
const SOFT = "#8a8377";
const BODY = "#4a453c";

function font(size, weight = 400) {
  return `${weight} ${size}px "Microsoft YaHei", "PingFang SC", sans-serif`;
}

// 英文按词、中文按字断行；返回实际行数
function wrapText(ctx, text, maxWidth, maxLines) {
  const lines = [];
  let line = "";
  for (const ch of String(text ?? "")) {
    if (ch === "\n") {
      lines.push(line);
      line = "";
      if (lines.length === maxLines) break;
      continue;
    }
    if (ctx.measureText(line + ch).width > maxWidth) {
      lines.push(line);
      line = ch;
      if (lines.length === maxLines) break;
    } else {
      line += ch;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines) {
    // 截断的最后一行补省略号（尽量不切单词太狠，直接截即可）
    const last = lines[maxLines - 1];
    if (last && String(text).length > lines.join("").length) {
      lines[maxLines - 1] = last.slice(0, -1) + "…";
    }
  }
  return lines;
}

export function downloadSharePoster({ kicker, title, excerpt, meta }) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // 纸面 + 双层手账框
  ctx.fillStyle = "#f6f2e7";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.strokeRect(44, 44, W - 88, H - 88);
  ctx.setLineDash([10, 8]);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(60, 60, W - 120, H - 120);
  ctx.setLineDash([]);

  // kicker + 顶部品牌
  ctx.fillStyle = SOFT;
  ctx.font = font(26);
  ctx.fillText("肥仔妙妙屋 · 手记", W - 100 - ctx.measureText("肥仔妙妙屋 · 手记").width, 150);
  ctx.fillStyle = SOFT;
  ctx.font = font(26);
  ctx.fillText(kicker, 100, 150);

  // 标题（奶油划线托底，最多 4 行）
  ctx.font = font(72, 800);
  const titleLines = wrapText(ctx, title, W - 200, 4);
  let y = 330;
  const titleStep = 96;
  titleLines.forEach((line, i) => {
    const isLast = i === titleLines.length - 1;
    const w = ctx.measureText(line).width;
    if (isLast) {
      ctx.fillStyle = CREAM;
      ctx.fillRect(96, y - 62, Math.min(w + 24, W - 200), 74);
    }
    ctx.fillStyle = INK;
    ctx.fillText(line, 100, y);
    y += titleStep;
  });

  // 摘要（最多 6 行）
  y += 26;
  ctx.fillStyle = BODY;
  ctx.font = font(32);
  const excerptLines = wrapText(ctx, excerpt, W - 210, 6);
  excerptLines.forEach((line) => {
    ctx.fillText(line, 100, y);
    y += 56;
  });

  // 信息行（日期等），压在虚线分隔下
  y += 30;
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = "#d8d2c2";
  ctx.beginPath();
  ctx.moveTo(100, y);
  ctx.lineTo(W - 100, y);
  ctx.stroke();
  ctx.setLineDash([]);
  y += 56;
  ctx.fillStyle = SOFT;
  ctx.font = font(28);
  ctx.fillText(meta, 100, y);

  // 落款（取自站长档案单一数据源）
  ctx.fillStyle = INK;
  ctx.font = font(30, 700);
  const sign = profile.sign;
  ctx.fillText(sign, W - 100 - ctx.measureText(sign).width, H - 120);

  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = `分享图-${String(title).slice(0, 12) || "手记"}.png`;
  a.click();
}
