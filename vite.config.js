import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: "/report-system/", // <-- BẮT BUỘC THÊM DÒNG NÀY (Tên repository GitHub của bạn)
  plugins: [react()],
})