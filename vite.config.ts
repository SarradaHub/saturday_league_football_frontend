import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
        target: "http://localhost:3004",
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on("proxyReq", (_proxyReq, req) => {
            console.log(
              "Proxying request:",
              req.method,
              req.url,
              "-> http://localhost:3004",
            );
          });
        },
      },
    },
  },
});
