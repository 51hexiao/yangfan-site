import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import localEditor from './plugins/local-editor.js'
import siteMeta from './plugins/site-meta.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), localEditor(), siteMeta(mode)],
}))
