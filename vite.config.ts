import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // 代码分割优化：减少首屏加载体积
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler')) return 'vendor-react'
            if (id.includes('lucide-react')) return 'vendor-icons'
            return 'vendor'
          }
          if (id.includes('/src/admin/')) return 'admin'
        },
      },
    },
    // 提高警告阈值，避免分包后仍有大 chunk 的误报
    chunkSizeWarningLimit: 600,
  },
})
