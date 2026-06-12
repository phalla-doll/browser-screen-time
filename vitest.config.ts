import path from "path"
import { defineConfig } from "vitest/config"

// Standalone test config (no crx plugin) for the pure, framework-free logic.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
})
