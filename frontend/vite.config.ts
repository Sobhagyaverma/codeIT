import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // sockjs-client expects Node's `global`, which doesn't exist in the browser
    global: "globalThis",
  },
  server: {
    port: 5173,
  },
})
