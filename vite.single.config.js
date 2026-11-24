import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// 单文件离线版：JS/CSS 全部内联进一个 index.html，双击即可上课（U 盘 / 教室断网场景）
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'offline',
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
})
