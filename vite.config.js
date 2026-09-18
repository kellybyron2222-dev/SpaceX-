import { defineConfig } from "vite";

export default defineConfig({
  // GitHub project Pages URL is https://<user>.github.io/SpaceX-/
  // Override with VITE_BASE=/ for root hosts such as Vercel.
  base: process.env.VITE_BASE || "/SpaceX-/",
  server: {
    host: true,
    port: 47321,
    strictPort: true,
    proxy: {
      "/ll2": {
        target: "https://ll.thespacedevs.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ll2/, ""),
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
  },
});
