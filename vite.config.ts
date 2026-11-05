import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// `--mode single` builds one self-contained index.html (JS, CSS and fonts inlined) for quick previews.
export default defineConfig(({ mode }) => ({
  plugins: mode === "single" ? [react(), viteSingleFile()] : [react()],
  build: mode === "single" ? { assetsInlineLimit: 100_000_000, cssCodeSplit: false } : {},
}));
