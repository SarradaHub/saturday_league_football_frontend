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
      "@sarradahub/design-system$": resolve(
        __dirname,
        "src/design-system/src/index.ts",
      ),
      "@sarradahub/design-system/tokens": resolve(
        __dirname,
        "src/design-system/src/tokens/index.ts",
      ),
      "@sarradahub/design-system/css": resolve(
        __dirname,
        "src/design-system/dist/styles.css",
      ),
    },
    conditions: ["import", "module", "browser", "default"],
  },
});
