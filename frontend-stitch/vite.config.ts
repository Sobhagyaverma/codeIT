import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      // y-monaco deep-imports this; Vite/rolldown needs an absolute path
      "monaco-editor/esm/vs/editor/editor.api.js": path.resolve(
        rootDir,
        "node_modules/monaco-editor/esm/vs/editor/editor.api.js"
      ),
    },
  },
  optimizeDeps: {
    include: ["yjs", "y-websocket", "y-monaco", "monaco-editor"],
  },
  server: {
    port: 5175,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:9091",
        changeOrigin: true,
      },
    },
  },
});
