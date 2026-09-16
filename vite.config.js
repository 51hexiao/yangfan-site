import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import gitDesk from './plugins/git-desk.js'
import localEditor from './plugins/local-editor.js'
import siteMeta from './plugins/site-meta.js'

// CI（GitHub Actions）会用 secrets 注入这三个变量；secret 未配置时注入的是空字符串而非缺省，
// 而 Vite 规定 process.env 已有值优先于 .env 文件——空串会顶掉 .env 里的有效配置。
// 空串一律视为未配置并删除，让随仓库提交的 .env 兜底；真配了 secrets 时非空、不受影响。
for (const key of ['SITE_URL', 'VITE_AMAP_KEY', 'VITE_AMAP_SECURITY']) {
  if (process.env[key] === '') delete process.env[key]
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => ({
  // 仅在构建时使用仓库名作为基路径，本地 dev 仍走根路径
  base: command === 'build' ? '/yangfan-site/' : '/',
  plugins: [react(), localEditor(), gitDesk(), siteMeta(mode)],
}))
