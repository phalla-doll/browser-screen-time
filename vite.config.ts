import path from "path"
import { crx } from "@crxjs/vite-plugin"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

import manifest from "./manifest.config"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), crx({ manifest })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      // Standalone extension page not referenced by the manifest.
      input: {
        dashboard: path.resolve(__dirname, "src/dashboard/index.html"),
      },
    },
  },
  // crxjs HMR for the extension pages during `vite dev`.
  server: {
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },
})
