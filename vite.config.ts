import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const pbUrl = env.VITE_PB_URL ?? 'http://localhost:8090'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        // Forward /api/collections (PocketBase REST) and /api/admins to the PB container.
        // This avoids CORS issues during local development.
        '/api': {
          target: pbUrl,
          changeOrigin: true,
        },
      },
    },
  }
})
