import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const designSystemRoot = resolve(__dirname, "../platform/design-system");
const designSystemSrc = resolve(designSystemRoot, "src/index.ts");
const designSystemTokensSrc = resolve(designSystemRoot, "src/tokens/index.ts");
const designSystemCss = resolve(
  designSystemRoot,
  "dist/tokens/css-variables.css",
);

// https://vite.dev/config/
const apiProxyTarget =
  process.env.VITE_API_PROXY_TARGET?.trim() || "http://localhost:3004";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      // Use design system source to guarantee Tailwind can scan classes
      "@sarradahub/design-system$": designSystemSrc,
      "@sarradahub/design-system/tokens": designSystemTokensSrc,
      "@sarradahub/design-system/css": designSystemCss,
    },
    // Ensure Vite respects package.json exports for subpath imports
    conditions: ["import", "module", "browser", "default"],
  },
  server: {
    port:
      process.env.PORT && process.env.PORT.trim() !== ""
        ? parseInt(process.env.PORT, 10)
        : process.env.VITE_PORT
          ? parseInt(process.env.VITE_PORT, 10)
          : 3002,
    strictPort: true,
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on("proxyReq", (_proxyReq, req) => {
            console.log(
              "Proxying request:",
              req.method,
              req.url,
              `-> ${apiProxyTarget}`,
            );
          });
        },
      },
    },
  },
});
