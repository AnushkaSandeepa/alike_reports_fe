// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // 👇 key fix: relative assets when packaged
  base: mode === "development" ? "/" : "./",
  build: {
    outDir: "dist",      // electron-builder expects dist/**
    emptyOutDir: true,
    sourcemap: false,
  },
  define: { "process.env": {} },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
}));
