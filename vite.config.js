import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages 部署配置
  // 如果倉庫名稱是 'map'，則 base 應該是 '/map/'
  // 如果使用自定義域名，則設置為 '/'
  // 可以通過環境變量 VITE_BASE_PATH 來覆蓋
  base: process.env.VITE_BASE_PATH || '/',
})
