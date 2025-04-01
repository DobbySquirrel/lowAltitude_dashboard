import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  server: {
    proxy: {
      "/mapv": {
        target: "https://mapv.baidu.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mapv/, ""),
      },
      '/socket.io': {
        target: 'http://10.4.152.244:5001',
        changeOrigin: true,
        ws: true
      }
    },
    host: '0.0.0.0'
  },
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    {
      name: 'html-transform',
      transformIndexHtml(html) {
        return html.replace(/%VITE_BAIDU_MAP_AK%/g, process.env.VITE_BAIDU_MAP_AK)
      }
    }
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'echarts': ['echarts'],
          'element-plus': ['element-plus']
        }
      }
    },
    target: 'es2015',
    modulePreload: true,
  },
  optimizeDeps: {
    include: ['echarts', 'jquery']
  }
})
