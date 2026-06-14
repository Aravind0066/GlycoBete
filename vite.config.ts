// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    server: {
      host: "localhost",
      port: 8080,
      strictPort: true,
      open: "/login",
      proxy: {
        "/api": {
          target: "http://localhost:8081",
          changeOrigin: true,
        },
        "/health": {
          target: "http://localhost:8081",
          changeOrigin: true,
        },
      },
      // Ensure TanStack Start is pre-bundled so the browser doesn't request
      // raw `.tsx` files from node_modules (prevents dynamic-import fetch errors).
      optimizeDeps: {
        include: ["@tanstack/react-start"]
      }
    },
  },
});
