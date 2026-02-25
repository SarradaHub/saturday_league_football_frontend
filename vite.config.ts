import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const designSystemRoot = resolve(__dirname, "src/design-system");
const designSystemSrc = resolve(designSystemRoot, "src/index.ts");
const designSystemTokensSrc = resolve(designSystemRoot, "src/tokens/index.ts");
const designSystemCss = resolve(designSystemRoot, "dist/styles.css");

const apiProxyTarget =
  process.env.VITE_API_PROXY_TARGET?.trim() || "http://localhost:3004";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@", replacement: resolve(__dirname, "src") },
      // Subpaths first so they are not matched by the base alias
      { find: "@sarradahub/design-system/tokens", replacement: designSystemTokensSrc },
      { find: "@sarradahub/design-system/css", replacement: designSystemCss },
      { find: "@sarradahub/design-system/icons", replacement: resolve(designSystemRoot, "src/icons/index.ts") },
      { find: "@sarradahub/design-system/utils", replacement: resolve(designSystemRoot, "src/utils/cn.ts") },
      { find: "@sarradahub/design-system", replacement: designSystemSrc },
    ],
    conditions: ["import", "module", "browser", "default"],
    dedupe: ["react", "react-dom", "lucide-react", "clsx"],
  },
  optimizeDeps: {
    include: ["lucide-react", "clsx"],
    exclude: ["@sarradahub/design-system"],
  },
  build: {
    commonjsOptions: {
      include: [/design-system/, /node_modules/],
    },
    rollupOptions: {
      external: () => false,
      output: {
        manualChunks: undefined,
      },
    },
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
      "/users": {
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
