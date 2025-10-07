import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  root: "client",
  build: {
    outDir: "client",
    emptyOutDir: true,
    sourcemap: false,
    minify: "terser",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    host: true
  },
  css: {
    postcss: "./postcss.config.js",
  },
  define: {
    global: 'globalThis',
  }
});