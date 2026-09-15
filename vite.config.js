import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import gitDesk from './plugins/git-desk.js'
import localEditor from './plugins/local-editor.js'
import siteMeta from './plugins/site-meta.js'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => ({
  // 仅在构建时使用仓库名作为基路径，本地 dev 仍走根路径
  base: command === 'build' ? '/yangfan-site/' : '/',
  plugins: [react(), localEditor(), gitDesk(), siteMeta(mode)],
}))
