import { defineConfig } from "vite";
import path from "path";

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@public": path.resolve(__dirname, "public"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "src/index.ts"),
        ...(mode === "production"
          ? { background: path.resolve(__dirname, "src/background.js") }
          : {}),
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
    outDir: "dist",
    emptyOutDir: true,
  },
}));
