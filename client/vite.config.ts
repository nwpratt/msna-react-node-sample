
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'

export default defineConfig({
  plugins: [react(), cesium()],
  define: { CESIUM_BASE_URL: JSON.stringify('/cesium') },
 server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://localhost:5001', changeOrigin: true }
    }
  }
});
