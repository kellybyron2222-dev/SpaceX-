import { defineConfig } from "vite";

export default defineConfig({
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
