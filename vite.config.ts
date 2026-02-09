import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const designSystemRoot = resolve(__dirname, "../platform/design-system");
const designSystemSrc = resolve(designSystemRoot, "src/index.ts");
const designSystemTokensSrc = resolve(designSystemRoot, "src/tokens/index.ts");
const designSystemCss = resolve(designSystemRoot, "dist/styles.css");

// https://vite.dev/config/
const apiProxyTarget =
  process.env.VITE_API_PROXY_TARGET?.trim() || "http://localhost:3004";

export default defineConfig({
  plugins: [
    react(),
    // Plugin to force use of source files instead of dist files
    {
      name: "force-design-system-source",
      resolveId(id, importer) {
        // Intercept any imports that might resolve to dist files
        if (id.includes("design-system") && id.includes("dist")) {
          // Replace dist with src
          return id.replace(/dist/g, "src").replace(/\.js$/, ".ts");
        }
        // If importer is from design-system dist, redirect to source
        if (importer && importer.includes("design-system/dist")) {
          // This is an import from within a dist file, we need to prevent this
          // by ensuring we use source files
          return null; // Let normal resolution handle it, but aliases should catch it
        }
      // Force resolution of design-system to source files
      if (
        id === "@sarradahub/design-system" ||
        id.startsWith("@sarradahub/design-system/") ||
        id === "@platform/design-system" ||
        id.startsWith("@platform/design-system/")
      ) {
        if (id === "@sarradahub/design-system" || id === "@platform/design-system") {
          return designSystemSrc;
        }
        if (
          id === "@sarradahub/design-system/tokens" ||
          id === "@platform/design-system/tokens"
        ) {
          return designSystemTokensSrc;
        }
        if (id === "@sarradahub/design-system/css" || id === "@platform/design-system/css") {
          return designSystemCss;
        }
        if (id === "@sarradahub/design-system/icons" || id === "@platform/design-system/icons") {
          return resolve(designSystemRoot, "src/icons/index.ts");
        }
        if (id === "@sarradahub/design-system/utils" || id === "@platform/design-system/utils") {
          return resolve(designSystemRoot, "src/utils/cn.ts");
        }
      }
        return null;
      },
      load(id) {
        // If trying to load a dist file, redirect to source
        if (id.includes("design-system/dist") && !id.includes("css-variables.css")) {
          return null; // Let Vite handle the actual loading
        }
        return null;
      },
    },
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      // Use design system source to guarantee consistent source imports
      "@sarradahub/design-system$": designSystemSrc,
      "@sarradahub/design-system/tokens": designSystemTokensSrc,
      "@sarradahub/design-system/css": designSystemCss,
      // Also alias any subpath imports that might reference dist files
      "@sarradahub/design-system/icons": resolve(designSystemRoot, "src/icons/index.ts"),
      "@sarradahub/design-system/utils": resolve(designSystemRoot, "src/utils/cn.ts"),
      "@platform/design-system$": designSystemSrc,
      "@platform/design-system/tokens": designSystemTokensSrc,
      "@platform/design-system/css": designSystemCss,
      "@platform/design-system/icons": resolve(designSystemRoot, "src/icons/index.ts"),
      "@platform/design-system/utils": resolve(designSystemRoot, "src/utils/cn.ts"),
    },
    // Ensure Vite respects package.json exports for subpath imports
    conditions: ["import", "module", "browser", "default"],
    // Resolve dependencies from design-system's node_modules or from root
    dedupe: ["react", "react-dom", "lucide-react", "clsx"],
  },
  optimizeDeps: {
    // Force Vite to pre-bundle design-system dependencies
    include: ["lucide-react", "clsx"],
    // Exclude design-system from optimization to use source files
    exclude: ["@sarradahub/design-system", "@platform/design-system"],
  },
  build: {
    commonjsOptions: {
      include: [/design-system/, /node_modules/],
    },
    rollupOptions: {
      // Ensure design-system dependencies are resolved from root node_modules
      external: () => {
        // Don't externalize anything - we want to bundle everything
        return false;
      },
      output: {
        // Ensure all dependencies are bundled
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
