import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: resolve(__dirname, "vitest.setup.ts"),
    css: true,
    coverage: {
      provider: "v8",
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      // Alias root import to the actual entry point
      "@sarradahub/design-system$": resolve(
        __dirname,
        "../platform/design-system/dist/index.js",
      ),
      // Alias subpath imports to their actual locations
      "@sarradahub/design-system/tokens": resolve(
        __dirname,
        "../platform/design-system/dist/tokens/index.js",
      ),
      "@sarradahub/design-system/css": resolve(
        __dirname,
        "../platform/design-system/dist/tokens/css-variables.css",
      ),
    },
    // Ensure Vite respects package.json exports for subpath imports
    conditions: ["import", "module", "browser", "default"],
  },
});
